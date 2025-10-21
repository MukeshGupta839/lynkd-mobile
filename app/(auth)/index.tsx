import OrDivider from "@/components/OrDivider";
import { AuthContext } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { apiCall } from "@/lib/api/apiService";
import useAuthTokenStore from "@/stores/authTokenStore";
import { getAuth } from "@/utils/firebase";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { appleAuthAndroid } from "@invertase/react-native-apple-authentication";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  Text as RNText,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import {
  ActivityIndicator as PaperSpinner,
  Text,
  TextInput,
} from "react-native-paper";
import GoogleLogo from "../../assets/svg/google-icon-logo.svg";

// Helper to extract message and code safely from unknown error
const extractErrorInfo = (err: unknown) => {
  if (err instanceof Error) {
    return { message: err.message, code: (err as any).code };
  }
  if (typeof err === "string") return { message: err, code: undefined };
  if (typeof err === "object" && err !== null) {
    const e: any = err as any;
    return { message: e.message ?? String(e), code: e.code };
  }
  return { message: String(err), code: undefined };
};

// Configure Google Sign In
GoogleSignin.configure({
  webClientId:
    "504427351394-3o0mhui0o5j2u7nselgekbgakfplppsk.apps.googleusercontent.com",
  offlineAccess: true,
});

interface FormContentProps {
  email: React.RefObject<string>;
  password: React.RefObject<string>;
  passwordVisible: boolean;
  setPasswordVisible: (value: boolean | ((prev: boolean) => boolean)) => void;
  emailError: string;
  setEmailError: (error: string) => void;
  passwordError: string;
  setPasswordError: (error: string) => void;
  disableButton: boolean;
  validateEmail: (str: string) => boolean;
  isKeyboardVisible: boolean;
  onAppleSignIn: () => void;
  onGoogleSignIn: () => void;
  onEmailPasswordLogin: () => void;
  socialLoginError: string;
}

const UsernameSetupContent = ({
  username,
  usernameError,
  clearToMove,
  onUsernameChange,
  onSaveUsername,
  onToggleAgreement,
  disableButton,
  setupPassword,
  setSetupPassword,
  setupPasswordError,
  referralCode,
  setReferralCode,
  referralCodeIsValid,
}: {
  username: string;
  usernameError: string;
  clearToMove: boolean;
  onUsernameChange: (text: string) => void;
  onSaveUsername: () => void;
  onToggleAgreement: () => void;
  disableButton: boolean;
  setupPassword: string;
  setSetupPassword: (text: string) => void;
  setupPasswordError: string;
  referralCode: string;
  setReferralCode: (text: string) => void;
  referralCodeIsValid: boolean;
}) => {
  return (
    <View className="bg-white p-4 rounded-2xl">
      <RNText className="text-black text-2xl pt-5 pb-6 font-worksans-500">
        Set Username
      </RNText>

      <View className="justify-center">
        <View className="w-full mt-3">
          <TextInput
            label="Username"
            value={username}
            onChangeText={onUsernameChange}
            mode="outlined"
            error={
              !!usernameError && usernameError !== "Username is available."
            }
            theme={{
              colors: { background: "white" },
              roundness: 12,
            }}
            outlineColor={
              username === ""
                ? "#bdbdbd"
                : usernameError === "" ||
                    usernameError === "Username is available."
                  ? "green"
                  : "red"
            }
            activeOutlineColor={
              usernameError === "" || usernameError === "Username is available."
                ? "green"
                : "red"
            }
          />
          {usernameError && (
            <Text
              style={{
                color:
                  usernameError === "Username is available." ? "green" : "red",
                marginTop: 4,
              }}
            >
              *{usernameError}
            </Text>
          )}
        </View>

        <View className="w-full mt-3">
          <TextInput
            label="Password"
            value={setupPassword}
            onChangeText={setSetupPassword}
            mode="outlined"
            secureTextEntry={true}
            error={!!setupPasswordError}
            theme={{
              colors: { background: "white" },
              roundness: 12,
            }}
            outlineColor="#bdbdbd"
            activeOutlineColor="#1b1b1b"
          />
          {setupPasswordError && (
            <Text style={{ color: "red", marginTop: 4 }}>
              *{setupPasswordError}
            </Text>
          )}
        </View>

        <View className="w-full mt-3">
          <TextInput
            label="Referral Code (Optional)"
            value={referralCode}
            onChangeText={setReferralCode}
            mode="flat"
            style={{ backgroundColor: "white" }}
            underlineColor="#bdbdbd"
            activeUnderlineColor="#1b1b1b"
            theme={{ colors: { background: "white" } }}
            right={
              referralCode.length > 0 ? (
                <TextInput.Icon
                  icon={referralCodeIsValid ? "check-circle" : "close-circle"}
                  color={referralCodeIsValid ? "green" : "red"}
                />
              ) : undefined
            }
          />
        </View>

        <View className="mt-6">
          <TouchableOpacity
            className="flex-row items-start"
            onPress={onToggleAgreement}
            activeOpacity={0.7}
          >
            <FontAwesome5
              name={clearToMove ? "check-square" : "square"}
              size={20}
              color={clearToMove ? "#000" : "#666"}
              style={{ marginTop: 2 }}
            />
            <View className="flex-1 ml-3">
              <RNText className="text-xs text-gray-500 leading-4">
                By proceeding, you agree to our{" "}
                <RNText className="text-xs text-blue-500 underline">
                  EULA
                </RNText>
                {", "}
                <RNText className="text-xs text-blue-500 underline">
                  Terms of Use
                </RNText>{" "}
                and{" "}
                <RNText className="text-xs text-blue-500 underline">
                  Privacy Policy.
                </RNText>
              </RNText>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          disabled={!clearToMove || disableButton || !!setupPasswordError}
          activeOpacity={0.8}
          className={`h-13 px-4 items-center justify-center rounded-xl mt-6 ${
            clearToMove && !disableButton && !setupPasswordError
              ? "bg-black"
              : "bg-gray-400"
          } shadow-sm`}
          onPress={onSaveUsername}
        >
          {disableButton ? (
            <PaperSpinner size="small" color="white" />
          ) : (
            <RNText className="text-white text-lg font-semibold">Finish</RNText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FormContent = ({
  email,
  password,
  passwordVisible,
  setPasswordVisible,
  emailError,
  setEmailError,
  passwordError,
  setPasswordError,
  disableButton,
  validateEmail,
  isKeyboardVisible,
  onAppleSignIn,
  onGoogleSignIn,
  onEmailPasswordLogin,
  socialLoginError,
}: FormContentProps) => {
  const forgotPasswordHandler = async () => {
    const auth = await getAuth();
    try {
      if (!email.current) {
        Alert.alert(
          "Email Required",
          "Please enter your email address to reset your password."
        );
        return;
      }
      await auth.sendPasswordResetEmail(email.current);
      Alert.alert(
        "Password Reset Email Sent",
        "Please check your email for the password reset link."
      );
    } catch (error) {
      console.error("Error sending password reset email:", error);
      Alert.alert("Error", "Failed to send password reset email.");
    }
  };
  return (
    <View className="bg-white p-4 rounded-2xl">
      <RNText className="text-black text-2xl pt-5 pb-10 font-worksans-500">
        Get Started!
      </RNText>
      <View className="w-full mt-3">
        <TextInput
          label="Email"
          onChangeText={(text) => {
            email.current = text;
            if (emailError) setEmailError("");
          }}
          onBlur={() => {
            if (!validateEmail(email.current)) {
              setEmailError("Please enter a valid email address.");
            }
          }}
          placeholderTextColor="#ccc"
          autoCapitalize="none"
          mode="outlined"
          error={!!emailError}
          keyboardType="email-address"
          theme={{
            colors: { background: "white" },
            roundness: 12,
          }}
          outlineColor="#bdbdbd"
          activeOutlineColor="#1b1b1b"
        />
        {emailError && (
          <Text style={{ color: "red", marginTop: 4 }}>{emailError}</Text>
        )}
      </View>

      <View className="w-full mt-3">
        <TextInput
          label="Password"
          secureTextEntry={!passwordVisible}
          onChangeText={(text) => {
            password.current = text;
            if (passwordError) setPasswordError("");
          }}
          mode="outlined"
          right={
            <TextInput.Icon
              icon={passwordVisible ? "eye" : "eye-off"}
              onPress={() => setPasswordVisible((v) => !v)}
            />
          }
          placeholderTextColor="#ccc"
          theme={{
            colors: { background: "white" },
            roundness: 12,
          }}
          outlineColor="#bdbdbd"
          activeOutlineColor="#1b1b1b"
          error={!!passwordError}
          className="rounded-lg"
        />
        {passwordError && (
          <Text style={{ color: "red", marginTop: 4 }}>{passwordError}</Text>
        )}
      </View>

      <TouchableOpacity
        className="my-3 self-end"
        onPress={forgotPasswordHandler}
      >
        <RNText className="text-gray-400">Forgot Password?</RNText>
      </TouchableOpacity>

      <View className="w-full">
        <TouchableOpacity
          disabled={disableButton}
          activeOpacity={0.8}
          className={`h-13 px-4 items-center justify-center rounded-xl ${
            disableButton ? "bg-gray-400" : "bg-black"
          } shadow-sm`}
          onPress={onEmailPasswordLogin}
        >
          {disableButton ? (
            <PaperSpinner size="small" color="white" />
          ) : (
            <RNText className="text-white text-lg font-semibold">Log In</RNText>
          )}
        </TouchableOpacity>
      </View>

      {!isKeyboardVisible && (
        <>
          <OrDivider />

          {/* Social Login Error Display */}
          {socialLoginError && (
            <View className="mb-3">
              <Text style={{ color: "red", textAlign: "center", fontSize: 14 }}>
                {socialLoginError}
              </Text>
            </View>
          )}

          <View className="flex-row">
            <TouchableOpacity
              activeOpacity={0.8}
              className="flex-1 flex-row items-center justify-center py-2 px-3 rounded-xl bg-gray-200 mr-2"
              onPress={onAppleSignIn}
              disabled={disableButton}
            >
              {disableButton ? (
                <PaperSpinner size="small" color="#000" />
              ) : (
                <>
                  <FontAwesome5 name="apple" size={22} color="#000" />
                  <RNText className="ml-2 text-black text-sm">
                    Sign in with Apple
                  </RNText>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              className="flex-1 flex-row items-center justify-center py-2 px-3 rounded-xl bg-gray-200 ml-2"
              onPress={onGoogleSignIn}
              disabled={disableButton}
            >
              {disableButton ? (
                <PaperSpinner size="small" color="#000" />
              ) : (
                <>
                  <GoogleLogo width={22} height={22} />
                  <RNText className="ml-2 text-black text-sm">
                    Sign in with Google
                  </RNText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default function LoginScreen() {
  const email = useRef("");
  const password = useRef("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [disableButton, setDisableButton] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [socialLoginError, setSocialLoginError] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [clearToMove, setClearToMove] = useState(false);

  // Additional states for username setup
  const [setupPassword, setSetupPassword] = useState("");
  const [setupPasswordError, setSetupPasswordError] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralCodeIsValid, setReferralCodeIsValid] = useState(false);

  // Debounce timeout ref
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get auth context and stores
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("AuthContext must be used within an AuthProvider");
  }

  const {
    setFirebaseUser,
    setUser,
    setIsCreator,
    setCompletedRegistration,
    setSignedInWithGoogle,
    user,
  } = authContext;

  const { registerUser, loginUser } = useAuthTokenStore();

  // Validate referral code
  const validateReferralCode = async (code: string) => {
    try {
      const response = await apiCall(
        `/api/referrals/validate/${code.toUpperCase()}`,
        "GET"
      );
      setReferralCodeIsValid(response.isValid || false);
    } catch (error) {
      console.error("Error validating referral code:", error);
      setReferralCodeIsValid(false);
    }
  };

  // Redeem referral code
  const redeemReferralCode = async (userID: number) => {
    if (!referralCode) return;

    try {
      const formData = new FormData();
      formData.append("referral_code", referralCode.toUpperCase());
      formData.append("user_id", userID.toString());
      const response = await apiCall("/api/referrals/use", "POST", formData);
      console.log("Referral code redeemed:", response.message);
    } catch (error) {
      console.error("Error redeeming referral code:", error);
    }
  };

  // Effect for referral code validation with debounce
  useEffect(() => {
    if (referralCode.length > 0) {
      const timeout = setTimeout(() => {
        validateReferralCode(referralCode);
      }, 300);
      return () => clearTimeout(timeout);
    } else {
      setReferralCodeIsValid(false);
    }
  }, [referralCode]);

  // Check username availability
  const checkUsernameAvailability = async (text: string) => {
    try {
      const response = await apiCall(`/api/users/usernameCheck/${text}`, "GET");
      return !response.user;
    } catch (error) {
      console.error("Error checking username availability:", error);
      return false;
    }
  };

  // Handle username change with validation and debouncing
  const handleUsernameChange = (text: string) => {
    setUsername(text);

    // Clear previous debounce timeout
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    // Debounce the API call to avoid multiple requests
    debounceTimeout.current = setTimeout(async () => {
      if (text.trim().length > 0) {
        // Check for invalid characters first
        if (!/^[a-zA-Z0-9._]+$/.test(text)) {
          setUsernameError(
            "Only letters, numbers, dots and underscores allowed."
          );
          return;
        }

        if (text.length < 6) {
          setUsernameError("Username must be 6 or more characters.");
          return;
        }

        if (text.length > 20) {
          setUsernameError("Username must be 20 or fewer characters.");
          return;
        }

        const isAvailable = await checkUsernameAvailability(
          text.trim().toLowerCase()
        );
        setUsernameError(
          text.trim() !== "" && isAvailable
            ? "Username is available."
            : "Username is already taken."
        );
      } else {
        setUsernameError("");
      }
    }, 300);
  };

  // Handle password change with validation
  const handlePasswordChange = (text: string) => {
    setSetupPassword(text);

    if (text.trim().length === 0) {
      setSetupPasswordError("");
      return;
    }

    if (!/[A-Z]/.test(text)) {
      setSetupPasswordError(
        "Password must contain at least one uppercase letter."
      );
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(text)) {
      setSetupPasswordError(
        "Password must contain at least one special character."
      );
      return;
    }

    if (text.length < 6) {
      setSetupPasswordError("Password must be 6 or more characters.");
      return;
    }

    setSetupPasswordError("");
  };

  // Email/Password Login handler
  const handleEmailPasswordLogin = async () => {
    try {
      // Reset errors
      setEmailError("");
      setPasswordError("");
      setSocialLoginError("");

      // Validate email
      if (!email.current || !validateEmail(email.current)) {
        setEmailError("Please enter a valid email address.");
        return;
      }

      // Validate password
      if (!password.current || password.current.trim().length === 0) {
        setPasswordError("Please enter your password.");
        return;
      }

      setDisableButton(true);
      console.log("Starting email/password login...");

      // Get Firebase auth instance
      const auth = await getAuth();
      if (!auth) {
        throw new Error("Firebase Auth not available");
      }

      // Sign in with Firebase
      const userCredential = await auth.signInWithEmailAndPassword(
        email.current,
        password.current
      );
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error("User information is missing after login.");
      }

      // Set Firebase user in context
      setFirebaseUser(firebaseUser);

      // Attempt Login via Backend to get auth token
      let response2;
      try {
        response2 = await loginUser({
          username: email.current,
          password: firebaseUser.uid,
        });
        console.log("Login Response", response2);
      } catch (loginError) {
        console.log("Login failed, attempting to register:", loginError);

        // Fallback to Registration
        try {
          await registerUser({
            username: email.current,
            password: firebaseUser.uid,
            user_id: firebaseUser.uid,
          });
          console.log("Registration successful, logging in...");

          // Immediately log in the newly registered user to get the token
          response2 = await loginUser({
            username: email.current,
            password: firebaseUser.uid,
          });
          console.log("Post-registration Login Response", response2);
        } catch (registerError) {
          console.error("Registration failed:", registerError);
          throw new Error("User registration failed.");
        }
      }

      // Fetch user data from backend
      const userDataResponse = await apiCall(
        `/api/users/${firebaseUser.uid}`,
        "GET"
      );

      if (userDataResponse?.user) {
        const userData = userDataResponse.user;

        // Set the user object from the backend in the context
        setUser({
          id: userData.id,
          firstName: userData.first_name,
          lastName: userData.last_name,
          email: userData.email,
          username: userData.username,
          bio: userData.bio,
          profilePicture: userData.profile_picture,
          isVerified: userData.is_verified,
          isPrivate: userData.is_private,
          createdAt: userData.created_at,
        });

        // Set isCreator in the context based on the response
        setIsCreator(userData.is_creator);

        // Set registration as complete
        setCompletedRegistration(true);

        // Store user data in SecureStore
        await SecureStore.setItemAsync("user", JSON.stringify(userData));

        // Navigate to main app
        router.push("/(tabs)");

        console.log("Login successful!");
      } else {
        throw new Error("User data not found.");
      }
    } catch (err) {
      const { message, code } = extractErrorInfo(err);
      console.error("Login failed:", message, code);

      // Check for network/backend errors
      if (message && message.includes("Cannot connect to server")) {
        setSocialLoginError(
          "Cannot reach the server. Please ensure:\n" +
            "1. Backend server is running on http://localhost:5000\n" +
            "2. You're connected to the internet\n" +
            "3. Firewall is not blocking the connection"
        );
      } else if (message && message.includes("Network error")) {
        setSocialLoginError(
          "Network error: Cannot connect to backend server. " +
            "Please start your backend server and try again."
        );
      } else if (code === "auth/user-not-found") {
        setEmailError("No account found with this email.");
      } else if (
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setPasswordError("Incorrect password. Please try again.");
      } else if (code === "auth/invalid-email") {
        setEmailError("Invalid email address.");
      } else if (code === "auth/too-many-requests") {
        setSocialLoginError(
          "Too many failed login attempts. Please try again later."
        );
      } else {
        setSocialLoginError(message || "Login failed. Please try again.");
      }
    } finally {
      setDisableButton(false);
    }
  };

  // Google Sign In handler
  const handleGoogleSignIn = async () => {
    try {
      setSocialLoginError("");
      setDisableButton(true);

      // Ensure Google Play Services are available
      await GoogleSignin.hasPlayServices();

      // Perform the Google Sign-In
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();

      // Get Firebase auth instance
      const auth = await getAuth();
      if (!auth) {
        throw new Error("Firebase Auth not available");
      }

      // Create Google credential dynamically
      const authModule = await import("@react-native-firebase/auth");
      const GoogleAuthProvider = authModule.default.GoogleAuthProvider;
      const googleCredential = GoogleAuthProvider.credential(idToken);

      const userCredential = await auth.signInWithCredential(googleCredential);
      const firebaseUser = userCredential.user;

      if (!userInfo || !firebaseUser) {
        throw new Error("User information is missing after Google Sign-In.");
      }

      // Set the Firebase user in AuthContext
      setFirebaseUser(firebaseUser);

      // Attempt Login via Backend
      let response2;
      try {
        response2 = await loginUser({
          username: firebaseUser.email!,
          password: firebaseUser.uid,
        });
        console.log("Login Response", response2);
      } catch (loginError) {
        console.log("Login failed, attempting to register:", loginError);

        // Fallback to Registration
        try {
          await registerUser({
            username: firebaseUser.email!,
            password: firebaseUser.uid,
            user_id: firebaseUser.uid,
          });
          console.log("Registration successful, logging in...");

          // Immediately log in the newly registered user to get the token
          response2 = await loginUser({
            username: firebaseUser.email!,
            password: firebaseUser.uid,
          });
          console.log("Post-registration Login Response", response2);
        } catch (registerError) {
          console.error("Registration failed:", registerError);
          throw new Error("User registration failed.");
        }
      }

      // Prepare form data
      const formData = new FormData();
      formData.append("uid", firebaseUser.uid);
      formData.append("email", firebaseUser.email!);

      // Call the backend to get or create the user
      const response = await apiCall(
        "/api/users/create/google",
        "POST",
        formData
      );
      const userData = response.user;

      setUser({
        id: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        username: userData.username,
        bio: userData.bio,
        profilePicture: userData.profile_picture,
        isVerified: userData.is_verified,
        isPrivate: userData.is_private,
        createdAt: userData.created_at,
      });

      setSignedInWithGoogle(true);

      // Check for missing fields and navigate accordingly
      if (
        !userData.username ||
        userData.username === "" ||
        userData.username === firebaseUser.email!.split("@")[0]
      ) {
        setShowUsernameSetup(true);
      } else {
        setIsCreator(userData.is_creator);
        setCompletedRegistration(true);
        router.push("/(tabs)");
      }
    } catch (err) {
      const { message } = extractErrorInfo(err);
      console.error("Google Sign-In Error:", message);
      setSocialLoginError(
        message || "Failed to sign in with Google. Please try again."
      );
    } finally {
      setDisableButton(false);
    }
  };

  // Apple Sign In handler
  // Apple Sign In handler
  const handleAppleSignIn = async () => {
    try {
      setSocialLoginError("");
      setDisableButton(true);

      // Get Firebase auth instance
      const auth = await getAuth();
      if (!auth) {
        throw new Error("Firebase Auth not available");
      }

      // Import auth module for providers
      const authModule = await import("@react-native-firebase/auth");

      // Generate a random nonce using Math.random (React Native compatible)
      const generateNonce = () => {
        const chars =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < 32; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      let idToken: string;
      let nonce: string;

      if (Platform.OS === "android") {
        // Android implementation using @invertase/react-native-apple-authentication

        if (!appleAuthAndroid.isSupported) {
          Alert.alert("Apple Sign-In is not supported on this device.");
          return;
        }

        // Generate secure, random values for state and nonce
        const rawNonce = generateNonce();
        const state = generateNonce();

        // Configure the request
        appleAuthAndroid.configure({
          clientId: "com.lynkd.socialcommerce.apple",
          redirectUri:
            "https://socialecom-a3615.firebaseapp.com/__/auth/handler",
          responseType: appleAuthAndroid.ResponseType.ALL,
          scope: appleAuthAndroid.Scope.ALL,
          nonce: rawNonce,
          state,
        });

        // Open the browser window for user sign in
        const response = await appleAuthAndroid.signIn();
        if (!response.id_token) {
          throw new Error("Apple Sign-In failed: No id_token received");
        }
        idToken = response.id_token;
        nonce = rawNonce;
      } else {
        // iOS implementation
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert("Apple Sign-In is not supported on this device.");
          return;
        }

        nonce = generateNonce();

        // Perform Apple Sign In
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        idToken = credential.identityToken!;
      }

      // Create Apple credential for Firebase
      const AppleAuthProvider = authModule.default.AppleAuthProvider;
      const appleCredential = AppleAuthProvider.credential(idToken, nonce);
      const userCredential = await auth.signInWithCredential(appleCredential);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error("User information is missing after Apple Sign-In.");
      }

      // Set the Firebase user in AuthContext
      setFirebaseUser(firebaseUser);

      // Try to login with existing account
      let response2;
      try {
        response2 = await loginUser({
          username: firebaseUser.email!,
          password: firebaseUser.uid,
        });
        console.log("Login Response", response2);
      } catch (loginError) {
        console.log("Login failed, attempting to register:", loginError);

        // Fallback to Registration if login fails
        try {
          await registerUser({
            username: firebaseUser.email!,
            password: firebaseUser.uid,
            user_id: firebaseUser.uid,
          });
          console.log("Registration successful, logging in...");

          // Login the newly registered user
          response2 = await loginUser({
            username: firebaseUser.email!,
            password: firebaseUser.uid,
          });
          console.log("Post-registration Login Response", response2);
        } catch (registerError) {
          console.error("Registration failed:", registerError);
          throw new Error("User registration failed.");
        }
      }

      // Prepare and send user data to backend
      const formData = new FormData();
      formData.append("uid", firebaseUser.uid);
      formData.append("email", firebaseUser.email!);

      // Call the backend to get or create the user
      const response = await apiCall(
        "/api/users/create/google",
        "POST",
        formData
      );
      const userData = response.user;

      setUser({
        id: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        username: userData.username,
        bio: userData.bio,
        profilePicture: userData.profile_picture,
        isVerified: userData.is_verified,
        isPrivate: userData.is_private,
        createdAt: userData.created_at,
      });

      // Similar logic to Google sign-in for navigation
      if (
        !userData.username ||
        userData.username === "" ||
        userData.username === firebaseUser.email!.split("@")[0]
      ) {
        setShowUsernameSetup(true);
      } else {
        setIsCreator(userData.is_creator);
        setCompletedRegistration(true);
        router.push("/(tabs)");
      }
    } catch (err) {
      const { message, code } = extractErrorInfo(err);
      if (code === "ERR_REQUEST_CANCELED") {
        // User canceled the sign-in
        console.log("Apple Sign-In canceled by user");
      } else {
        console.error("Apple Sign-In Error:", message, code);
        setSocialLoginError(
          message || "Failed to sign in with Apple. Please try again."
        );
      }
    } finally {
      setDisableButton(false);
    }
  };

  // Save username and complete setup
  const handleSaveUsername = async () => {
    try {
      if (usernameError && usernameError !== "Username is available.") {
        return;
      }

      if (!clearToMove) {
        return;
      }

      setDisableButton(true);

      // Get current Firebase user
      const auth = await getAuth();
      const currentUser = auth?.currentUser;

      if (!currentUser) {
        Alert.alert("Error", "No user is currently authenticated.");
        return;
      }

      // If password is set, link it to the Firebase account
      if (setupPassword) {
        try {
          const authModule = await import("@react-native-firebase/auth");
          const EmailAuthProvider = authModule.default.EmailAuthProvider;
          const credential = EmailAuthProvider.credential(
            currentUser.email!,
            setupPassword
          );

          await currentUser.linkWithCredential(credential);
          console.log("Password added successfully");

          // Send email verification if needed
          if (!currentUser.emailVerified) {
            await currentUser.sendEmailVerification();
          }
        } catch (err) {
          const { message } = extractErrorInfo(err);
          console.error("Error adding password:", message);
          Alert.alert("Error", "Failed to add password. " + (message || ""));
        }
      }

      // Redeem referral code if provided
      if (user?.id) {
        await redeemReferralCode(user.id);
      }

      // Update username on backend
      const formData = new FormData();
      formData.append("username", username.trim().toLowerCase());
      formData.append(
        "first_name",
        currentUser?.displayName?.trim()?.split(" ")[0] || ""
      );
      formData.append(
        "last_name",
        currentUser?.displayName?.trim()?.split(" ")[1] || ""
      );

      const response = await apiCall(
        `/api/users/update-username/${currentUser.uid}`,
        "PUT",
        formData
      );

      // Update user in context
      const userData = response.user;
      setUser({
        id: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        username: userData.username,
        bio: userData.bio,
        profilePicture: userData.profile_picture,
        isVerified: userData.is_verified,
        isPrivate: userData.is_private,
        createdAt: userData.created_at,
      });

      setIsCreator(userData.is_creator);
      setCompletedRegistration(true);

      // Save to secure storage
      await SecureStore.setItemAsync("user", JSON.stringify(userData));

      // Navigate to main app
      router.push("/(tabs)");

      console.log("Username saved successfully!");
    } catch (error: any) {
      console.error("Save Username Error:", error);
      Alert.alert("Error", "Failed to save username. Please try again.");
    } finally {
      setDisableButton(false);
    }
  };

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardVisible(true);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const validateEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  const auth = useAuth();

  console.log("login screen Auth Context:", auth);

  return (
    <View
      className={`flex-1 bg-black ${Platform.OS === "ios" ? "px-3 pt-safe -pb-safe-offset-3" : "px-3 py-safe"}`}
    >
      <StatusBar style="light" />
      <TouchableOpacity className="border border-white px-3 py-1.5 rounded-2xl flex-row justify-center items-center gap-1.5 self-end">
        <RNText className="text-white font-poppins-regular text-sm">
          Explore
        </RNText>
        <FontAwesome5 name="shopping-bag" size={13} color="#fff" />
      </TouchableOpacity>
      <View className="absolute top-24 w-full left-5 right-5">
        <RNText className="text-white text-6xl text-center tracking-ultra-wide mt-24 font-poppins-light leading-[55px]">
          LYNKD
        </RNText>
      </View>
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-end",
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={10}
        extraKeyboardSpace={-10}
      >
        {showUsernameSetup ? (
          <UsernameSetupContent
            username={username}
            usernameError={usernameError}
            clearToMove={clearToMove}
            onUsernameChange={handleUsernameChange}
            onSaveUsername={handleSaveUsername}
            onToggleAgreement={() => setClearToMove(!clearToMove)}
            disableButton={disableButton}
            setupPassword={setupPassword}
            setSetupPassword={setSetupPassword}
            setupPasswordError={setupPasswordError}
            referralCode={referralCode}
            setReferralCode={setReferralCode}
            referralCodeIsValid={referralCodeIsValid}
          />
        ) : (
          <FormContent
            email={email}
            password={password}
            passwordVisible={passwordVisible}
            setPasswordVisible={setPasswordVisible}
            emailError={emailError}
            setEmailError={setEmailError}
            passwordError={passwordError}
            setPasswordError={setPasswordError}
            disableButton={disableButton}
            validateEmail={validateEmail}
            isKeyboardVisible={isKeyboardVisible}
            onAppleSignIn={handleAppleSignIn}
            onGoogleSignIn={handleGoogleSignIn}
            onEmailPasswordLogin={handleEmailPasswordLogin}
            socialLoginError={socialLoginError}
          />
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}
