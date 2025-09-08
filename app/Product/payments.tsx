import OffersCard from "@/components/Productview/OffersCard";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type UpiMethod = "gpay" | "phonepe" | "paytm" | "manual";

export default function Payments() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ total?: string }>();

  const amount = useMemo(() => {
    const n = Number(params?.total);
    return Number.isFinite(n) && n > 0 ? n : 71999;
  }, [params]);

  const [selectedUpi, setSelectedUpi] = useState<UpiMethod>("gpay");
  const [showSuccess, setShowSuccess] = useState(false);

  const INR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const Radio = ({ active }: { active: boolean }) => (
    <View
      className={`items-center justify-center rounded-full w-[7%] aspect-square border ${
        active ? "border-black" : "border-gray-300"
      }`}
    >
      {active ? (
        <View className="w-[55%] aspect-square rounded-full bg-black" />
      ) : null}
    </View>
  );

  return (
    // Root View → content can extend under the notch / home indicator
    <View className="flex-1 bg-gray-100">
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Header that paints the notch area */}
      <View
        className="bg-white rounded-b-2xl px-[5%] py-3 shadow"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-1 mr-2">
            <Ionicons name="arrow-back" size={20} color="black" />
          </TouchableOpacity>
          <View>
            <Text className="text-[11px] text-gray-500">Step 2 of 2</Text>
            <Text className="text-sm font-semibold mt-0.5">Payments</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: (insets.bottom || 0) + 96 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Amount (edge-to-edge card) */}
        <View className="mt-3 rounded-2xl overflow-hidden">
          <View className="bg-[#FFFFF9] px-[5%] py-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold">Total Amount</Text>
              <Text className="text-base font-semibold">{INR(amount)}</Text>
            </View>
          </View>
        </View>

        {/* Offers (edge-to-edge). If OffersCard has internal margin, neutralize it with -mx */}
        <View className="bg-white rounded-2xl py-3 mt-3">
          <View className="">
            <OffersCard showBankOffers={false} />
          </View>
        </View>

        {/* UPI (edge-to-edge) */}
        <View className="bg-white mt-3 rounded-2xl py-3 px-[5%]">
          <Text className="text-sm font-semibold mb-2">Pay by any UPI App</Text>

          <View className="rounded-xl border border-gray-200 overflow-hidden">
            {[
              {
                key: "gpay",
                label: "Google Pay",
                icon: "logo-google" as const,
              },
              {
                key: "phonepe",
                label: "PhonePe",
                icon: "phone-portrait-outline" as const,
              },
              { key: "paytm", label: "Paytm", icon: "logo-paypal" as const },
            ].map((m, i, arr) => (
              <View key={m.key}>
                <TouchableOpacity
                  onPress={() => setSelectedUpi(m.key as UpiMethod)}
                  className="flex-row items-center justify-between px-3 py-3 bg-white"
                >
                  <View className="flex-row items-center w-[90%]">
                    <View className="w-[9%] aspect-square rounded-md bg-gray-100 items-center justify-center mr-2">
                      <Ionicons name={m.icon} size={16} color="#000" />
                    </View>
                    <Text className="text-sm">{m.label}</Text>
                  </View>
                  <Radio active={selectedUpi === m.key} />
                </TouchableOpacity>
                {i < arr.length - 1 && <View className="bg-gray-200" />}
              </View>
            ))}

            <View className="bg-gray-200" />
            <TouchableOpacity
              onPress={() => setSelectedUpi("manual")}
              className="flex-row items-center justify-between px-3 py-3 bg-white"
            >
              <View className="flex-row items-center w-[90%]">
                <View className="w-[9%] aspect-square rounded-md bg-gray-100 items-center justify-center mr-2">
                  <Ionicons name="add" size={16} color="#000" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm">Add New UPI ID</Text>
                  <Text className="text-[11px] text-gray-500">
                    You need to have a registered UPI ID
                  </Text>
                </View>
              </View>
              <Radio active={selectedUpi === "manual"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Cards (edge-to-edge) */}
        <View className="bg-white mt-3 rounded-2xl px-[5%] py-3">
          <Text className="text-sm font-semibold mb-2">
            Credit & Debit Cards
          </Text>
          <TouchableOpacity className="flex-row items-center px-3 py-3 rounded-xl border border-gray-200">
            <View className="w-[9%] aspect-square rounded-md bg-gray-100 items-center justify-center mr-2">
              <Ionicons name="add" size={16} color="#000" />
            </View>
            <View className="flex-1">
              <Text className="text-sm">Add New Card</Text>
              <Text className="text-[11px] text-gray-500">
                Save and Pay via Cards
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- Bottom total card (matches 430x71) & paints home-indicator --- */}
      <View
        className="absolute inset-x-0 bottom-0"
        style={{ zIndex: 50, elevation: 50 }}
      >
        <View
          className="bg-white w-full rounded-t-xxs border-t border-black/10 aspect-[6.056]"
          style={{ paddingBottom: insets.bottom }}
        >
          <View className="flex-1 flex-row items-center justify-between px-[5%] pt-2 ">
            <View>
              <Text className="text-[1.25rem] font-semibold">
                {INR(amount)}
              </Text>
              <Text className="text-[0.75rem] text-gray-400 line-through opacity-70">
                20,0000
              </Text>
            </View>

            {/* Pay Now button: 187x54 → width 43.5% of card, height via aspect */}
            <TouchableOpacity
              className="ml-[3%] mt-2 bg-[#26FF91] rounded-2xl items-center justify-center border border-black/10"
              style={{ width: "43.5%", aspectRatio: 3.463 }}
              onPress={() => setShowSuccess(true)}
            >
              <Text className="text-[1rem] font-semibold">Pay Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ✅ SUCCESS MODAL */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen" // iOS: draw over everything
        statusBarTranslucent // ANDROID: cover the status bar area
        onRequestClose={() => setShowSuccess(false)}
      >
        {/* Dim background that closes on tap */}
        <TouchableWithoutFeedback onPress={() => setShowSuccess(false)}>
          <View className="flex-1 bg-black/40">
            {/* Center area; keep overlay full-screen, only space the CARD with insets */}
            <View className="flex-1 items-center justify-center">
              {/* Tap-catcher to keep taps inside card from closing */}
              <TouchableWithoutFeedback>
                <View
                  className="w-[80%] bg-white rounded-2xl p-6 space-y-6"
                  style={{
                    // keep nice breathing room from notch & home indicator
                    marginTop: insets.top,
                    marginBottom: insets.bottom,
                  }}
                >
                  <View className="items-center space-y-3">
                    <View className="w-16 aspect-square rounded-full bg-green-100 items-center justify-center">
                      <Ionicons
                        name="checkmark-circle"
                        size={42}
                        color="#22c55e"
                      />
                    </View>
                    <Text className="text-base mt-2 text-center">
                      Congratulations!
                    </Text>
                    <Text className="text-xs text-gray-600 mt-1 text-center">
                      Your order has been placed.
                    </Text>
                  </View>

                  <TouchableOpacity
                    className="w-full bg-[#26FF91] rounded-xl py-4 items-center mt-6 justify-center"
                    onPress={() => {
                      setShowSuccess(false);
                      router.push("/(tabs)/product");
                    }}
                  >
                    <Text className="text-sm font-semibold">Purchase More</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
