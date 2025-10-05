// app/(settings)/AccountDeletion.tsx
import ScreenHeaderBack from "@/components/ScreenHeaderBack"; // adjust path if needed
import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Pure UI screen:
 * - Choose a reason (Picker)
 * - Optional additional feedback (multiline)
 * - Confirm email (text field)
 * - Confirm button (disabled until reason+email present)
 */
const AccountDeletion: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<string>("");
  const [reasonLabel, setReasonLabel] = useState<string>("Select a reason");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [additionalInfo, setAdditionalInfo] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const reasonOptions = [
    { key: "privacy", value: "Privacy concerns" },
    { key: "noNeed", value: "No longer needed" },
    { key: "alternative", value: "Found a better alternative" },
    { key: "ads", value: "Too many ads" },
    { key: "other", value: "Other" },
  ];

  const canSubmit = useMemo(
    () => reason.trim().length > 0 && email.trim().length > 0,
    [reason, email]
  );

  const onPressConfirm = () => {
    if (!canSubmit) {
      Alert.alert(
        "Missing info",
        "Please select a reason and enter your email."
      );
      return;
    }

    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // UI-only: pretend the request was sent
            Alert.alert(
              "Request Sent",
              "Your deletion request has been submitted. We'll email you shortly."
            );
          },
        },
      ]
    );
  };

  return (
    <View
      className="flex-1 bg-zinc-100"
      style={{ paddingTop: insets.top - 10 }}
    >
      <ScreenHeaderBack title="Account Deletion" />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Reason */}
        <Text className="mt-4 mb-2 text-lg font-semibold text-zinc-900">
          Reason for Deletion
        </Text>

        {/* Custom Dropdown Button */}
        <TouchableOpacity
          className="flex-row items-center justify-between rounded-xl bg-white px-4 py-3 border border-gray-200"
          onPress={() => setIsDropdownOpen(true)}
        >
          <Text
            className={`text-base ${reason ? "text-zinc-900" : "text-zinc-400"}`}
          >
            {reasonLabel}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#71717a" />
        </TouchableOpacity>

        {/* Modal Dropdown - No UI Shift! */}
        <Modal
          visible={isDropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDropdownOpen(false)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-center px-6"
            onPress={() => setIsDropdownOpen(false)}
          >
            <View className="bg-white rounded-2xl overflow-hidden max-h-96">
              {/* Header */}
              <View className="bg-zinc-100 px-4 py-3 border-b border-zinc-200">
                <Text className="text-base font-semibold text-zinc-900">
                  Select a reason
                </Text>
              </View>

              {/* Options List */}
              <ScrollView>
                {reasonOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    className={`px-4 py-4 border-b border-zinc-100 ${
                      reason === option.key ? "bg-indigo-50" : ""
                    }`}
                    onPress={() => {
                      setReason(option.key);
                      setReasonLabel(option.value);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        className={`text-base ${
                          reason === option.key
                            ? "text-indigo-600 font-semibold"
                            : "text-zinc-900"
                        }`}
                      >
                        {option.value}
                      </Text>
                      {reason === option.key && (
                        <MaterialIcons name="check" size={20} color="#4f46e5" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Cancel Button */}
              <TouchableOpacity
                className="px-4 py-3 bg-zinc-50 border-t border-zinc-200"
                onPress={() => setIsDropdownOpen(false)}
              >
                <Text className="text-center text-base font-semibold text-zinc-600">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* Additional info */}
        <Text className="mt-5 mb-2 text-lg font-semibold text-zinc-900">
          Additional Information
        </Text>
        <TextInput
          value={additionalInfo}
          onChangeText={setAdditionalInfo}
          multiline
          numberOfLines={4}
          placeholder="Please provide any additional feedback..."
          placeholderTextColor="#a1a1aa"
          className="rounded-xl bg-white px-4 py-3 border border-gray-200 text-base text-zinc-900"
          style={{
            minHeight: 100,
            textAlignVertical: "top",
          }}
        />

        {/* Email */}
        <Text className="mt-5 mb-2 text-lg font-semibold text-zinc-900">
          Confirm Your Email
        </Text>
        <View
          className="flex-row items-center rounded-xl bg-white px-4 border border-gray-200"
          style={{ height: 42 }} // <- fixed control height
        >
          <MaterialIcons name="email" size={20} color="#71717a" />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email address"
            placeholderTextColor="#a1a1aa"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            className="flex-1 ml-3 text-base text-zinc-900"
            style={{
              // keep the text vertically centered on both platforms
              paddingVertical: 0,
              // Android centering
              textAlignVertical: "center" as any,
              // @ts-ignore: Android only, ignored on iOS
              includeFontPadding: false,
              // iOS baseline fix: align text visually to the icon
              ...(Platform.OS === "ios"
                ? {
                    fontSize: 16,
                    lineHeight: 20, // a smidge above fontSize looks best
                    height: 20, // match lineHeight for perfect centering
                  }
                : {}),
            }}
          />
        </View>

        {/* Info box */}
        <View className="mt-6 flex-row items-start rounded-xl bg-indigo-50 p-4">
          <MaterialIcons name="info" size={22} color="#3b82f6" />
          <Text className="ml-3 flex-1 text-[14px] leading-5 text-zinc-800">
            Deleting your account will remove all your data and cannot be
            undone. If you’re having issues, consider contacting support first.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          className={[
            "mt-6 h-12 items-center justify-center rounded-full",
            canSubmit ? "bg-zinc-900" : "bg-zinc-400",
          ].join(" ")}
          disabled={!canSubmit}
          onPress={onPressConfirm}
        >
          <Text className="text-white text-base font-semibold">
            Confirm Deletion
          </Text>
        </TouchableOpacity>

        {/* Support */}
        <View className="mt-3">
          <Text className="text-center text-sm text-zinc-600">Need help?</Text>
          <Text className="text-center text-sm text-zinc-600">
            Contact support at{" "}
            <Text className="font-semibold">support@lynkd.app</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default AccountDeletion;
