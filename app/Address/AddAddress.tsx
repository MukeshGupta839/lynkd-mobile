// app/…/AddAddress.tsx
/// <reference types="react" />
import FormInput from "@/components/FormInput";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

/**
 * Small list of countries/codes for the example.
 * You can expand this to a fuller list or substitute a proper country-picker component.
 */
const COUNTRIES = [
  { code: "+91", label: "India", flag: "🇮🇳" },
  { code: "+1", label: "USA", flag: "🇺🇸" },
  { code: "+44", label: "UK", flag: "🇬🇧" },
  { code: "+61", label: "Australia", flag: "🇦🇺" },
];

export default function AddAddress() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // controlled form state
  const [house, setHouse] = useState("");
  const [fullName, setFullName] = useState("");

  // phone numbers: store only digits here; combine with country code when needed
  const [mobile, setMobile] = useState("");
  const [altMobile, setAltMobile] = useState("");

  // country code states for each phone field (default to India)
  const [countryIndex, setCountryIndex] = useState(0);
  const [altCountryIndex, setAltCountryIndex] = useState(0);

  // small focused state to drive styling in FormInput
  const [focused, setFocused] = useState<string | null>(null);

  // derived validation: require house, fullName, mobile (simple)
  const canSave = useMemo(() => {
    const hasHouse = house.trim().length > 0;
    const hasName = fullName.trim().length > 0;
    const hasMobile = mobile.trim().length >= 7; // minimal check
    return hasHouse && hasName && hasMobile;
  }, [house, fullName, mobile]);

  // handlers
  const goBack = useCallback(() => router.back(), [router]);

  const onSave = useCallback(() => {
    if (!canSave) return;

    // combine phone numbers with country codes for any API / storage use
    const primaryPhone = `${COUNTRIES[countryIndex].code}${mobile}`;
    const secondaryPhone =
      altMobile.trim().length > 0
        ? `${COUNTRIES[altCountryIndex].code}${altMobile}`
        : undefined;

    // TODO: send `{ house, fullName, primaryPhone, secondaryPhone }` to backend / store
    // For now navigate back:
    console.log("Saving address", {
      house,
      fullName,
      primaryPhone,
      secondaryPhone,
    });
    router.replace("/(tabs)/profile"); // adjust route as needed
  }, [
    canSave,
    router,
    countryIndex,
    altCountryIndex,
    house,
    fullName,
    mobile,
    altMobile,
  ]);

  const onFocus = useCallback((key: string) => setFocused(key), []);
  const onBlur = useCallback(() => setFocused(null), []);

  // cycle country code on touch (simple behavior). Replace with a modal picker if needed.
  const toggleCountry = useCallback(() => {
    setCountryIndex((i) => (i + 1) % COUNTRIES.length);
  }, []);

  const toggleAltCountry = useCallback(() => {
    setAltCountryIndex((i) => (i + 1) % COUNTRIES.length);
  }, []);

  // phone input helpers: keep only digits (optional)
  const onChangePhone = (text: string, setter: (s: string) => void) => {
    // strip non-digits. You can relax this if you want separators.
    const digits = text.replace(/\D/g, "");
    setter(digits);
  };

  // small helpers to wire focus events to parent 'focused' state (if FormInput relies on it)
  const handlePhoneFocus = (key: string) => () => onFocus(key);
  const handlePhoneBlur = () => onBlur();

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}>
        {/* Header */}
        <View className="flex-row items-center px-3  bg-white shadow-sm">
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
          className="flex-1 px-3 mt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}>
          <FormInput
            label="Flat / House no. / Building Name"
            placeholder="eg. 12B, Rose Apartments"
            value={house}
            onChangeText={setHouse}
            isFocused={focused === "house"}
            onFocus={() => onFocus("house")}
            onBlur={onBlur}
          />

          <FormInput
            label="Full Name"
            placeholder="eg. John Doe"
            value={fullName}
            onChangeText={setFullName}
            isFocused={focused === "name"}
            onFocus={() => onFocus("name")}
            onBlur={onBlur}
          />

          {/* Mobile number row with country code selector */}
          <View className="mt-3">
            <Text className="text-gray-700 text-sm mb-2">Mobile Number</Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={toggleCountry}
                className="px-3 py-3 mr-2 rounded-lg border border-gray-200 items-center justify-center"
                accessibilityLabel="Select country code">
                <Text>{`${COUNTRIES[countryIndex].flag} ${COUNTRIES[countryIndex].code}`}</Text>
              </TouchableOpacity>

              <TextInput
                value={mobile}
                onChangeText={(t) => onChangePhone(t, setMobile)}
                keyboardType="phone-pad"
                placeholder="1234567890"
                placeholderTextColor="#9CA3AF"
                returnKeyType="done"
                onFocus={handlePhoneFocus("mobile")}
                onBlur={handlePhoneBlur}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderColor: focused === "mobile" ? "#10B981" : "#E5E7EB",
                  borderRadius: 8,
                }}
              />
            </View>
            <Text className="text-xs text-gray-400 mt-2">
              Country code: tap to change (cycles sample list). Full
              international number will be saved as{" "}
              {COUNTRIES[countryIndex].code} + number.
            </Text>
          </View>

          {/* Alternate Mobile number row */}
          <View className="mt-4">
            <Text className="text-gray-700 text-sm mb-2">
              Alternate Mobile Number (optional)
            </Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={toggleAltCountry}
                className="px-3 py-3 mr-2 rounded-lg border border-gray-200 items-center justify-center"
                accessibilityLabel="Select alternate country code">
                <Text>{`${COUNTRIES[altCountryIndex].flag} ${COUNTRIES[altCountryIndex].code}`}</Text>
              </TouchableOpacity>

              <TextInput
                value={altMobile}
                onChangeText={(t) => onChangePhone(t, setAltMobile)}
                keyboardType="phone-pad"
                placeholder="Optional: 9876543210"
                placeholderTextColor="#9CA3AF"
                returnKeyType="done"
                onFocus={handlePhoneFocus("altmobile")}
                onBlur={handlePhoneBlur}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderColor: focused === "altmobile" ? "#10B981" : "#E5E7EB",
                  borderRadius: 8,
                }}
              />
            </View>
          </View>

          {/* You can add other address fields here (landmark, city, state, pincode...) */}
          <FormInput
            label="Landmark (optional)"
            placeholder="eg. Near City Mall"
            value={""}
            onChangeText={() => {}}
            isFocused={false}
            onFocus={() => {}}
            onBlur={() => {}}
          />

          <FormInput
            label="City"
            placeholder="eg. Bengaluru"
            value={""}
            onChangeText={() => {}}
            isFocused={false}
            onFocus={() => {}}
            onBlur={() => {}}
          />

          <FormInput
            label="State"
            placeholder="eg. Karnataka"
            value={""}
            onChangeText={() => {}}
            isFocused={false}
            onFocus={() => {}}
            onBlur={() => {}}
          />

          <FormInput
            label="Pincode"
            placeholder="eg. 560001"
            value={""}
            onChangeText={() => {}}
            keyboardType="numeric"
            isFocused={false}
            onFocus={() => {}}
            onBlur={() => {}}
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
              className={`w-full py-4 items-center justify-center rounded-lg ${canSave ? "bg-[#26FF91]" : "bg-gray-300"}`}>
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
