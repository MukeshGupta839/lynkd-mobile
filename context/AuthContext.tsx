import * as SecureStore from "expo-secure-store";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { apiCall } from "../lib/api/apiService"; // Your utility for API calls
import { getAuth } from "../utils/firebase";

// Minimal context typing. Use `any` where the exact shape isn't necessary yet.
export interface AuthContextType {
  firebaseUser: any | null;
  setFirebaseUser: Dispatch<SetStateAction<any | null>>;
  user: any | null;
  setUser: Dispatch<SetStateAction<any | null>>;
  setIsCreator: Dispatch<SetStateAction<boolean>>;
  isCreator: boolean;
  completedRegistration: boolean;
  setCompletedRegistration: Dispatch<SetStateAction<boolean>>;
  cameFromSetPassword: boolean;
  setCameFromSetPassword: Dispatch<SetStateAction<boolean>>;
  completeUserRegistration: (details: any) => Promise<void>;
  instagramData: any | null;
  fetchInstagramData: (username: string) => Promise<void>;
  linkInstagramAccount: () => Promise<void>;
  resetInstagramData: () => void;
  resetUserState: (navigationCallback?: () => void) => Promise<void>;
  loading: boolean;
  setSignedInWithGoogle: Dispatch<SetStateAction<boolean>>;
  uploadInstaPosts: (posts: any) => Promise<void>;
  refetchAuthContext: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null); // Track Firebase user
  const [user, setUser] = useState<any | null>(null); // App user with details
  const [isCreator, setIsCreator] = useState<boolean>(false); // Track creator status
  const [completedRegistration, setCompletedRegistration] =
    useState<boolean>(false);
  // removed unused `initializing` state
  const [cameFromSetPassword, setCameFromSetPassword] =
    useState<boolean>(false);
  const [instagramData, setInstagramData] = useState<any | null>(null); // Instagram data state
  const [loading, setLoading] = useState<boolean>(true); // Track loading state
  const [signedInWithGoogle, setSignedInWithGoogle] = useState<boolean>(false);

  // Combine Firebase and SecureStore loading
  // Move resetUserState above the effect and memoize to satisfy hooks lint rules
  const resetUserState = useCallback(
    async (navigationCallback?: () => void) => {
      try {
        // Clear all auth-related state
        const clearState = async () => {
          setFirebaseUser(null);
          setUser(null);
          setIsCreator(false);
          setCompletedRegistration(false);
          setInstagramData(null);
          setSignedInWithGoogle(false);
          await SecureStore.deleteItemAsync("user");
        };

        // Handle sign out
        const handleSignOut = async () => {
          try {
            const auth = await getAuth();
            const currentUser = auth?.currentUser;
            if (currentUser && auth?.signOut) {
              await auth.signOut();
            }
          } catch (err) {
            console.warn("Error while signing out from Firebase auth:", err);
          }

          if (signedInWithGoogle) {
            try {
              // Dynamically import to avoid loading native module at app startup
              const gs = await import(
                "@react-native-google-signin/google-signin"
              );
              if (gs?.GoogleSignin?.signOut) {
                await gs.GoogleSignin.signOut();
              }
            } catch (err) {
              console.warn(
                "Google sign out failed or GoogleSignin not available:",
                err
              );
            }
          }
        };

        // Execute state clearing and sign out in sequence
        await clearState();
        await handleSignOut();

        console.log("User state reset successfully");

        // Execute navigation callback if provided
        if (typeof navigationCallback === "function") {
          navigationCallback();
        }
      } catch (error) {
        console.error("Reset user state error:", error);
        // Even if there's an error, ensure the state is cleared
        setFirebaseUser(null);
        setUser(null);
        setIsCreator(false);
        setCompletedRegistration(false);
        setInstagramData(null);
        await SecureStore.deleteItemAsync("user").catch(console.error);
      }
    },
    [signedInWithGoogle]
  );

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync("user");
        if (storedUser && isMounted) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsCreator(parsedUser.is_creator);
          setCompletedRegistration(true);
        }

        // Only setup the listener if user creation or storage is complete
        if (isMounted && !cameFromSetPassword) {
          setupAuthListener();
        }
      } catch (error) {
        console.error("Failed to load user from storage:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const setupAuthListener = () => {
      let localUnsub: (() => void) | undefined;
      (async () => {
        const auth = await getAuth();
        if (!auth || !auth.onAuthStateChanged) {
          console.warn("Firebase Auth not available; skipping auth listener.");
          return;
        }

        localUnsub = auth.onAuthStateChanged(async (firebaseAuthUser: any) => {
          if (!isMounted) return;

          if (firebaseAuthUser) {
            setFirebaseUser(firebaseAuthUser);

            try {
              // Fetch user details from your backend
              const response = await apiCall(
                `/api/users/${firebaseAuthUser.uid}`,
                "GET"
              );

              if (response?.user) {
                const userData = response.user;
                setUser(userData);
                setIsCreator(userData.is_creator);
                setCompletedRegistration(true);

                // Persist user data in SecureStore
                await SecureStore.setItemAsync(
                  "user",
                  JSON.stringify(userData)
                );
              }
            } catch (error) {
              console.error("Error fetching user details from backend:", error);
            }
          } else {
            // User is signed out
            await resetUserState();
          }
        });
      })();

      // Return an unsubscribe function for cleanup
      return () => {
        if (typeof localUnsub === "function") localUnsub();
      };
    };

    initializeAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [cameFromSetPassword, resetUserState]);

  // resetUserState is defined above using useCallback and SecureStore

  // Function to fetch and store Instagram data temporarily
  const fetchInstagramData = async (username: string) => {
    try {
      const response = await apiCall(`/api/instagram/${username}`, "GET");
      setInstagramData(response.data); // Store fetched data in state
    } catch (error) {
      console.error("Error fetching Instagram data:", error);
    }
  };

  // Link Instagram data to the user in the backend
  const linkInstagramAccount = async () => {
    if (!firebaseUser || !instagramData) {
      console.error("User or Instagram data is missing");
      return;
    }

    const payload = {
      user_id: user?.id,
      instagram_username: instagramData.username,
      full_name: instagramData.fullName,
      followers_count: instagramData.followers,
      following_count: instagramData.following,
      bio: instagramData.bio,
      profile_pic_url: instagramData.profilePic,
      account_type: instagramData.accountType,
      posts_count: instagramData.postsCount,
    };

    try {
      const response = await apiCall(
        `/api/instagram/add/${user?.id}`,
        "POST",
        payload
      );
      console.log("API response:", response.data);

      // Update local user state
      setUser((prev: any) => ({
        ...(prev || {}),
        instagramUsername: instagramData.username,
        instagramVerified: true,
      }));

      console.log("Instagram account linked successfully.");
    } catch (error) {
      console.error("Error linking Instagram account:", error);
      // Using console.warn as a fallback if Alert is not working
      console.warn("Failed to link Instagram account.");
    }
  };

  const refetchAuthContext = async () => {
    try {
      // setLoading(true);
      const response = await apiCall(`/api/users/${firebaseUser?.uid}`, "GET");
      if (response?.user) {
        const userData = response.user;
        setUser(userData);
        setIsCreator(userData.is_creator);
        setCompletedRegistration(true);
        await SecureStore.setItemAsync("user", JSON.stringify(userData));
      }
      // setLoading(false);
    } catch (error) {
      console.error("Error fetching user details from backend:", error);
    }
  };

  // Reset Instagram data
  const resetInstagramData = () => {
    setInstagramData(null); // Clear Instagram data
  };

  const uploadInstaPosts = async (posts: any) => {
    console.log("Uploading posts:", posts);
    try {
      if (!firebaseUser) throw new Error("No authenticated Firebase user");
      if (!user) throw new Error("No app user data");

      const body = {
        firebaseUID: firebaseUser.uid,
        posts: posts,
        userID: user.id,
        location: "From Instagram",
      };
      console.log(body);
      const response = await apiCall("/api/instagram/post", "POST", body, {
        "Content-Type": "application/json",
      });
      console.log("API response:", response.data);
    } catch (error) {
      console.error("Error uploading posts:", error);
    }
  };

  // Complete user registration after entering details
  const completeUserRegistration = async (details: any) => {
    try {
      if (!firebaseUser) throw new Error("No authenticated user found");

      const userData = details;
      // Merge carefully
      const firebaseUserObj = firebaseUser ?? {};
      setUser({ ...firebaseUserObj, ...userData });
      setCompletedRegistration(true);
      setCameFromSetPassword(false);
    } catch (error) {
      console.error("Error completing user registration:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        setFirebaseUser,
        user,
        setUser,
        setIsCreator,
        isCreator,
        completedRegistration,
        setCompletedRegistration,
        cameFromSetPassword,
        setCameFromSetPassword,
        completeUserRegistration,
        instagramData,
        fetchInstagramData,
        linkInstagramAccount,
        resetInstagramData,
        resetUserState,
        loading,
        setSignedInWithGoogle,
        uploadInstaPosts,
        refetchAuthContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
