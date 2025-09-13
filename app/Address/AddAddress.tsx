// app/…/AddAddress.tsx
import FormInput from "@/components/FormInput";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function AddAddress() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // controlled form state
  const [house, setHouse] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [altMobile, setAltMobile] = useState("");

  // small focused state to drive styling in FormInput
  const [focused, setFocused] = useState<string | null>(null);

  // derived validation: require house, fullName, mobile (simple)
  const canSave = useMemo(() => {
    const hasHouse = house.trim().length > 0;
    const hasName = fullName.trim().length > 0;
    const hasMobile = mobile.trim().length >= 7; // minimal check
    return hasHouse && hasName && hasMobile;
  }, [house, fullName, mobile]);

  // handlers (stable)
  const goBack = useCallback(() => router.back(), [router]);

  const onSave = useCallback(() => {
    if (!canSave) return;

    router.replace("/(tabs)/profile"); // adjust route as needed
  }, [canSave, router]);

  const onFocus = useCallback((key: string) => setFocused(key), []);
  const onBlur = useCallback(() => setFocused(null), []);

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}>
        {/* Header */}
        <View className="flex-row items-center px-[5%] py-[4%] bg-white shadow-sm">
          <TouchableOpacity
            onPress={goBack}
            accessibilityLabel="Go back"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="mr-4">
            <Ionicons name="arrow-back" size={20} color="black" />
          </TouchableOpacity>

          <Text className="text-base font-semibold">Add New Address</Text>
        </View>

        {/* Form (scrollable) */}
        <ScrollView
          className="flex-1 px-[5%] mt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}>
          <FormInput
            label="Flat/House no. / Building Name"
            value={house}
            onChangeText={setHouse}
            isFocused={focused === "house"}
            onFocus={() => onFocus("house")}
            onBlur={onBlur}
          />

          <FormInput
            label="Enter Full Name"
            value={fullName}
            onChangeText={setFullName}
            isFocused={focused === "name"}
            onFocus={() => onFocus("name")}
            onBlur={onBlur}
          />

          <FormInput
            label="Mobile Number"
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={setMobile}
            isFocused={focused === "mobile"}
            onFocus={() => onFocus("mobile")}
            onBlur={onBlur}
          />

          <FormInput
            label="Alternate Mobile Number"
            keyboardType="phone-pad"
            value={altMobile}
            onChangeText={setAltMobile}
            isFocused={focused === "altmobile"}
            onFocus={() => onFocus("altmobile")}
            onBlur={onBlur}
          />
        </ScrollView>

        {/* Floating Bottom Button (uses safe area inset) */}
        <View className="absolute bottom-6 left-0 right-0 ">
          <View className="px-3">
            <TouchableOpacity
              onPress={onSave}
              accessibilityLabel="Save address"
              accessibilityState={{ disabled: !canSave }}
              activeOpacity={0.9}
              disabled={!canSave}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-full py-4 items-center justify-center rounded-lg bg-[#26FF91]">
              <Text className="text-black font-semibold text-sm">
                Save Address
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
