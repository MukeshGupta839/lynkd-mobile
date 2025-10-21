// app/(settings)/deletionRequestSuccess.tsx
import { AuthContext } from "@/context/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";
import auth from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import { useContext, useEffect, useRef } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DeletionRequestSuccess() {
  const insets = useSafeAreaInsets();
  const authContext = useContext(AuthContext);
  const resetUserState = authContext?.resetUserState;
  const isMounted = useRef(true);
  const router = useRouter();

  const logout = async () => {
    try {
      console.log("Starting logout process from deletion success screen...");

      // Sign out from Firebase
      await auth().signOut();

      // Reset user state
      if (resetUserState) {
        await resetUserState();
      }

      console.log("Logout process completed");

      // Use replace to clear the navigation stack and prevent going back
      router.replace("/(auth)");
    } catch (error: any) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    // Auto logout after 3 seconds
    const timer = setTimeout(() => {
      logout();
    }, 3000);

    return () => {
      clearTimeout(timer);
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      className="flex-1 bg-white justify-center px-5"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Icon Circle */}
      <View className="w-32 h-32 rounded-full bg-indigo-100 justify-center items-center self-center mb-6">
        <MaterialIcons name="schedule" size={100} color="#4f46e5" />
      </View>

      {/* Title */}
      <Text className="text-xl text-center font-semibold text-zinc-900 mb-3 px-4">
        Account Deletion Request Submitted
      </Text>

      {/* Subtitle */}
      <Text className="text-sm text-center text-zinc-600 leading-6 px-6">
        Your account deletion request has been successfully submitted. We will
        contact you within 24-48 hours to complete the deletion process. You
        will be signed out shortly.
      </Text>

      {/* Auto-logout indicator */}
      <View className="mt-8 flex-row items-center justify-center">
        <MaterialIcons name="info-outline" size={16} color="#71717a" />
        <Text className="text-xs text-zinc-500 ml-2">
          Signing out in 3 seconds...
        </Text>
      </View>
    </View>
  );
}
