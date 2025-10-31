// app/(settings)/legalpolicies.tsx
import ScreenHeaderBack from "@/components/ScreenHeaderBack";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PolicyKey =
  | "Terms of Use"
  | "End User License Agreement (EULA)"
  | "Privacy Policy"
  | "Community Guidelines"
  | "Commissions & Fees Policy"
  | "AI Generated Content Policy (In Development)"
  | "Other Policies";

const POLICIES: PolicyKey[] = [
  "Terms of Use",
  "End User License Agreement (EULA)",
  "Privacy Policy",
  "Community Guidelines",
  "Commissions & Fees Policy",
  "AI Generated Content Policy (In Development)",
  "Other Policies",
];

// Same item look as Settings list rows
const PolicyItem: React.FC<{ title: string; onPress: () => void }> = ({
  title,
  onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    className="flex-row items-center px-3 py-3 border-b border-gray-200 bg-white"
  >
    <Ionicons name="document-text-outline" size={20} color="#000" />
    <Text className="flex-1 ml-4 text-base text-gray-800">{title}</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>
);

const LegalPolicies: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const items = useMemo(() => POLICIES, []);

  const handlePolicyPress = (policy: PolicyKey) => {
    router.push({
      pathname: "/(settings)/policyViewer",
      params: { policyTitle: policy }, // pdf resolved inside viewer
    });
  };

  return (
    <View
      className="flex-1 bg-gray-100"
      style={{ paddingTop: insets.top - 10 }}
    >
      <ScreenHeaderBack title="Legal Policies" onBack={() => router.back()} />

      <ScrollView
        style={{
          width: Dimensions.get("window").width * 0.96,
          alignSelf: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Group title + rounded container (matches SettingGroup) */}
        <View className="mt-2">
          <View className="rounded-xl overflow-hidden border border-gray-100 bg-white">
            {items.map((policy) => (
              <PolicyItem
                key={policy}
                title={policy}
                onPress={() => handlePolicyPress(policy)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default LegalPolicies;
