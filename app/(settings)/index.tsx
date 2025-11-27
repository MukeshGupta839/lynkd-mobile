// app/screens/SettingsMain.tsx
import ScreenHeaderBack from "@/components/ScreenHeaderBack";
import { AuthContext } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { apiCall } from "@/lib/api/apiService";
import useAuthTokenStore from "@/stores/authTokenStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React, { useContext } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// If you want navigation, uncomment and wire your navigator
// import { useNavigation } from "@react-navigation/native";

type SettingItemProps = {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
  iconColor?: string;
};

type User = {
  id: number;
  username: string;
  is_creator: boolean;
};

const SettingItem = ({
  title,
  icon,
  onPress,
  iconColor = "#000",
}: SettingItemProps) => (
  <TouchableOpacity
    className="flex-row items-center px-3 py-3 border-b border-gray-200 bg-white"
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Ionicons name={icon} size={20} color={iconColor} />
    <Text className="flex-1 ml-4 text-[14px] text-gray-800">{title}</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>
);

const SettingGroup = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View className="mt-4">
    <Text className="text-[14px] text-gray-800 font-semibold mb-2 ml-1">
      {title}
    </Text>
    <View className="rounded-xl overflow-hidden border border-gray-100 bg-white">
      {children}
    </View>
  </View>
);

const LogoutType = ({ title, icon, onPress }: SettingItemProps) => (
  <TouchableOpacity
    className="flex-row items-center px-3 py-3 border-b border-gray-200 bg-white"
    onPress={onPress}
  >
    <Ionicons name={icon} size={20} color="#333" />
    <Text className="flex-1 ml-4 text-[14px] text-gray-800">{title}</Text>
  </TouchableOpacity>
);

const AccountType = () => {
  const {
    user,
    isCreator,
    setIsCreator,
    firebaseUser,
    setUser,
    resetUserState,
  } = useAuth();

  const handleSaveProfile = async () => {
    try {
      const accountType = !isCreator;
      if (!firebaseUser) throw new Error("No authenticated user found.");

      const uid = firebaseUser.uid;
      const formData = new FormData();
      formData.append("uid", uid);
      // FormData expects string or Blob; convert boolean to string
      formData.append("isCreator", JSON.stringify(accountType));
      const url = `/api/users/editing/type/${uid}`;
      console.log("URL:", url);
      // Use 'apiCall' for the API call
      const response = await apiCall(url, "POST", formData, {
        "Content-Type": "multipart/form-data",
      });

      if (response.user) {
        const updatedUser = {
          ...user,
          is_creator: response.user.is_creator,
        };

        setUser(updatedUser);
        setIsCreator(response.user.is_creator);

        // Alert.alert('Profile Updated', 'Your profile has been updated successfully.');

        // Replace navigation to the appropriate area — use router.replace to avoid using undefined navigator
        // Adjust destination as needed; here we go to the profile tab which will reflect changes
        router.replace("/(tabs)/profile");
      } else {
        throw new Error("Failed to update profile.");
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      // Handle unknown error types safely
      let message = "Issue updating your profile.";
      if (error instanceof Error) message = error.message;
      else if (typeof error === "string") message = error;

      Alert.alert("Profile Update Failed", message);
    }
  };

  return (
    <View className="flex-row items-center justify-between px-3 py-2 border-b border-gray-200 bg-white">
      <View className="flex-row items-center">
        <Ionicons name="person-circle-outline" size={20} color="#333" />
        <Text className="ml-3 text-[14px] text-gray-800">
          {isCreator ? "Public" : "Private"}
        </Text>
      </View>
      <TouchableOpacity
        className="bg-gray-100 px-3 py-1 rounded-full"
        onPress={handleSaveProfile}
      >
        <Text className="text-[12px] text-gray-800 font-medium">
          {isCreator ? "Switch to Private" : "Switch to Public"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function SettingsMain() {
  const insets = useSafeAreaInsets();

  const { user } = useAuth();

  const resetUserState = useContext(AuthContext)?.resetUserState;
  const logoutUser = useAuthTokenStore((state) => state.logoutUser);

  const logout = async () => {
    try {
      console.log("Starting logout process...");

      // Logout from token store first
      await logoutUser();

      // Reset user state
      if (resetUserState) {
        await resetUserState();
      }

      console.log("Logout completed successfully");

      // Use replace to clear the navigation stack and prevent going back
      router.dismissAll(); // pops to the first screen in the stack (e.g. /(tabs))
      router.replace("/(auth)");
    } catch (error: any) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <View
      className="flex-1 bg-gray-100"
      style={{ paddingTop: insets.top - 10 }}
    >
      <ScreenHeaderBack
        title="Settings"
        onBack={() => {
          router.back();
        }}
      />
      {/* Header left out per your snippet; plug your ScreenHeaderBack if needed */}
      <ScrollView
        style={{
          width: Dimensions.get("window").width * 0.96,
          alignSelf: "center",
        }}
      >
        <SettingGroup title="General Settings">
          <SettingItem
            title="Password & Security"
            icon="lock-closed-outline"
            onPress={() => router.push("/(settings)/changePassword")}
          />
          <SettingItem
            title="Analytics"
            icon="analytics-outline"
            onPress={() => router.push("/(settings)/analytics-coming-soon")}
          />
          <SettingItem
            title="Favourites"
            icon="star-outline"
            onPress={() => router.push("/(settings)/favorites")}
          />
          <SettingItem
            title="Import From Instagram"
            icon="logo-instagram"
            onPress={() => router.push("/(settings)/instagramVerification")}
          />

          {user?.is_creator && (
            <SettingItem
              title="Agency Collaborations"
              icon="ticket-outline"
              onPress={() => router.push("/(settings)/agencyInvites")}
            />
          )}

          <AccountType />

          <SettingItem
            title="Request for Account Deletion"
            icon="archive-outline"
            iconColor="red"
            onPress={() => router.push("/(settings)/accountDeletion")}
          />
          <SettingItem
            title="Legal Policies"
            icon="document-text-outline"
            onPress={() => router.push("/(settings)/legalPolicies")}
          />
          <SettingItem
            title="App Information"
            icon="phone-portrait-outline"
            onPress={() => router.push("/(settings)/appInformation")}
          />
          <LogoutType title="Logout" icon="exit-outline" onPress={logout} />
        </SettingGroup>
      </ScrollView>
    </View>
  );
}
