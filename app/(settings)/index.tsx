// app/screens/SettingsMain.tsx
import ScreenHeaderBack from "@/components/ScreenHeaderBack";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

const AccountType = ({
  isCreator,
  setIsCreator,
}: {
  isCreator: boolean;
  setIsCreator: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const handleSaveProfile = () => {
    setIsCreator((prev) => !prev);
    Alert.alert("Updated", `Switched to ${isCreator ? "Private" : "Public"}`);
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
  const router = useRouter();

  // ---- DUMMY DATA (no context) ----
  const [user] = useState<User>({
    id: 1,
    username: "nupurs",
    is_creator: true,
  });
  const [isCreator, setIsCreator] = useState<boolean>(true);

  const logout = async () => {
    try {
      Alert.alert("Signed out", "You have been signed out. (dummy)");
    } catch (error: any) {
      console.error("Logout failed:", error);
      Alert.alert("Logout Failed", error?.message || "Unexpected error.");
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
          {/* <SettingItem
            title="Order History"
            icon="receipt-outline"
            // onPress={() => navigator.navigate("MyOrders" as never)}
          /> */}
          {/* <SettingItem
            title="Share Profile"
            icon="share-outline"
            // onPress={() => navigator.navigate("InviteUsers" as never)}
          /> */}
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

          {user.is_creator && (
            <SettingItem
              title="Agency Collaborations"
              icon="ticket-outline"
              onPress={() => router.push("/(settings)/agencyInvites")}
            />
          )}

          <AccountType isCreator={isCreator} setIsCreator={setIsCreator} />

          <SettingItem
            title="Request for Account Deletion"
            icon="archive-outline"
            iconColor="red"
            onPress={() => router.push("/(settings)/accountDeletion")}
          />
          <SettingItem
            title="Legal Policies"
            icon="document-text-outline"
            // onPress={() => navigator.navigate("LegalPolicies" as never)}
          />
          <SettingItem
            title="App Information"
            icon="phone-portrait-outline"
            // onPress={() => navigator.navigate("AppInformation" as never)}
          />
          <LogoutType title="Logout" icon="exit-outline" onPress={logout} />
        </SettingGroup>
      </ScrollView>
    </View>
  );
}
