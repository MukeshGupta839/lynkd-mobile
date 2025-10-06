// app/Services/PersonalDetails.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import HeroHeader from "@/components/Services/HeroHeader";
import { NEARBY_DATA, RECOMMENDED_DATA } from "@/constants/services";

type IncomingPayload = {
  id?: string | null;
  title?: string | null;
  address?: string | null;
  date?: { day?: string; date?: string } | null;
  time?: string | null;
  vehicle?: string | null;
};

export default function PersonalDetails() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const { id: idParam, payload: payloadParam } = useLocalSearchParams<{
    id?: string;
    payload?: string;
  }>();

  const parsedPayload = useMemo<IncomingPayload | null>(() => {
    if (!payloadParam) return null;
    try {
      return JSON.parse(String(payloadParam));
    } catch {
      return null;
    }
  }, [payloadParam]);

  const incomingId = String(
    parsedPayload?.id ?? (parsedPayload as any)?.booking?.id ?? idParam ?? ""
  );

  const service = useMemo(() => {
    if (!incomingId) return null;
    const all = [...(NEARBY_DATA ?? []), ...(RECOMMENDED_DATA ?? [])] as any[];
    return all.find((s) => String(s.id) === incomingId) ?? null;
  }, [incomingId]);

  const heroImage =
    (service as any)?.image ??
    (parsedPayload as any)?.image ??
    require("@/assets/images/kfc.png");
  const heroTitle =
    (service as any)?.title ?? parsedPayload?.title ?? "Service";
  const heroAddress =
    "Vincom Center, No. 70 Le Thanh Ton, Ben Nghe Ward, District 1, HCMC";
  const heroRating = (service as any)?.rating ?? 4.6;

  const imageHeight = Math.round(width * 0.65);

  // ---- form state ----
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState<string>("");

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const forwardedBooking = parsedPayload ?? undefined;

  // country code modal state
  const [showCountryModal, setShowCountryModal] = useState(false);
  const COUNTRY_CODES = [
    { label: "+1 (US)", code: "+1" },
    { label: "+44 (UK)", code: "+44" },
    { label: "+61 (AU)", code: "+61" },
    { label: "+91 (IN)", code: "+91" },
    { label: "+82 (KR)", code: "+82" },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <HeroHeader
        heroSource={heroImage}
        imageWidth={width}
        imageHeight={imageHeight}
        title={heroTitle}
        address={heroAddress}
        rating={heroRating}
        onBack={() => router.back()}
        onRightPress={() => {}}
        rightIconName="cart"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        <SafeAreaView edges={["left", "right", "bottom"]} className="px-3 pt-4">
          {/* Details form card */}
          <View
            className="bg-white rounded-2xl p-3 mb-3"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.03,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}>
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Enter Your Details
            </Text>

            {/* Name */}
            <Text className="text-sm text-gray-700 mb-1">Enter your Name</Text>
            <View
              className={`bg-white rounded-lg px-2 py-2 mb-2 border ${
                focusedField === "name" ? "border-black" : "border-gray-300"
              }`}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                placeholderTextColor="#9CA3AF"
                className="text-sm text-gray-900"
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Mobile */}
            <Text className="text-sm text-gray-700 mb-1">
              Enter your Mobile Number
            </Text>
            <View
              className={`bg-white rounded-lg mb-2 flex-row items-center border ${
                focusedField === "phone" ? "border-black" : "border-gray-300"
              }`}
              style={{
                paddingLeft: 8,
                paddingRight: 8,
                paddingVertical: 6,
              }}>
              <TouchableOpacity
                activeOpacity={0.9}
                className="px-2 py-1 rounded"
                onPress={() => setShowCountryModal(true)}>
                <Text className="text-sm text-gray-800 font-medium">
                  {countryCode}
                </Text>
              </TouchableOpacity>

              <TextInput
                value={phone}
                onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ""))}
                keyboardType="phone-pad"
                placeholder="9876543210"
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-sm text-gray-900 ml-3"
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Email */}
            <Text className="text-sm text-gray-700 mb-1">Enter your Email</Text>
            <View
              className={`bg-white rounded-lg px-2 py-2 mb-2 border ${
                focusedField === "email" ? "border-black" : "border-gray-300"
              }`}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="name@example.com"
                placeholderTextColor="#9CA3AF"
                className="text-sm text-gray-900"
                autoCapitalize="none"
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Members card */}
          <View
            className="bg-white rounded-2xl p-3 mt-3"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.03,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}>
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              How Many Members
            </Text>
            <Text className="text-sm text-gray-500 mb-2">Enter numbers</Text>

            <View
              className={`bg-white rounded-lg px-2 py-2 border ${
                focusedField === "members" ? "border-black" : "border-gray-300"
              }`}>
              <TextInput
                value={members}
                onChangeText={(v) => setMembers(v.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholder="E.g. 2"
                placeholderTextColor="#9CA3AF"
                className="text-sm text-gray-900"
                onFocus={() => setFocusedField("members")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Sticky Confirm button */}
      <View className="absolute left-0 right-0 bottom-6 px-3">
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/Product/payments",
              params: { source: "service", total: "1999" },
            })
          }
          activeOpacity={0.95}
          className="w-full rounded-xl items-center justify-center h-14 bg-[#1B19A8]">
          <Text className="text-white font-semibold text-base">Pay now</Text>
        </TouchableOpacity>
      </View>

      {/* Country Code Modal */}
      <Modal
        visible={showCountryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCountryModal(false)}>
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full max-w-md bg-white rounded-2xl p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Select country code
            </Text>
            {COUNTRY_CODES.map((c) => (
              <TouchableOpacity
                key={c.code}
                activeOpacity={0.85}
                onPress={() => {
                  setCountryCode(c.code);
                  setShowCountryModal(false);
                }}
                className="py-2">
                <Text className="text-sm text-gray-800">{c.label}</Text>
              </TouchableOpacity>
            ))}
            <View className="flex-row justify-end mt-3">
              <TouchableOpacity
                onPress={() => setShowCountryModal(false)}
                activeOpacity={0.9}
                className="px-3 py-2 rounded-lg">
                <Text className="text-gray-700">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
