// app/book/payment.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNavBar from "@/components/Bookings/BottomBar";
import Header from "@/components/Bookings/Header";
import { EventT, POPULAR_EVENTS, UPCOMING_EVENTS } from "@/constants/bookings";

type Method = {
  id: string;
  label: string;
  subtitle?: string;
  balance?: string;
  kind?: "google" | "apple" | "card";
};

export default function PaymentMethod() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    qty?: string;
    type?: string;
    amount?: string;
  }>();
  const id = params?.id ?? "";
  const qty = Number(params?.qty ?? "1");
  const type = params?.type ?? "";
  const amount = params?.amount ?? "";

  // find event for display (optional)
  const event = useMemo<EventT | undefined>(() => {
    return [...UPCOMING_EVENTS, ...POPULAR_EVENTS].find((e) => e.id === id);
  }, [id]);

  // Methods list (no external icons required)
  const methods: Method[] = [
    {
      id: "google_pay",
      label: "Google Pay",
      subtitle: "f************n@gmail.com",
      balance: "$1,234.00",
      kind: "google",
    },
    {
      id: "apple_pay",
      label: "Apple Pay",
      subtitle: "f************n@gmail.com",
      balance: "$2,766.00",
      kind: "apple",
    },
    {
      id: "visa",
      label: "Visa",
      subtitle: "**** **** **** 1234",
      balance: "$1,876,766.00",
      kind: "card",
    },
    {
      id: "master",
      label: "Master Card",
      subtitle: "**** **** **** 1234",
      balance: "$2,876,766.00",
      kind: "card",
    },
  ];

  const [selected, setSelected] = useState<string>(methods[1].id); // default Apple Pay

  const onConfirm = () => {
    // navigate to success screen (create app/book/success.tsx)
    router.push({
      pathname: "/Bookings/sucess",
      params: { id, qty: String(qty), type, method: selected, amount },
    });
  };

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <Header title="Payment method" />
        <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
          <View className="px-3 mt-8">
            <Text className="text-sm text-gray-600 mb-5">
              Select Payment Method
            </Text>

            {/* Methods list */}
            {methods.map((m) => {
              const isSelected = selected === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  activeOpacity={0.95}
                  onPress={() => setSelected(m.id)}
                  className="mb-3">
                  <View
                    className="flex-row items-center bg-white p-4 rounded-xl"
                    style={{
                      borderWidth: 1.5,
                      borderColor: isSelected ? "#7C3AED" : "#E6E6EA",
                    }}>
                    {/* icon */}
                    <View className="w-12 h-12 rounded-lg items-center justify-center bg-gray-50">
                      {m.kind === "google" && (
                        <View className="flex-row items-center">
                          <Ionicons
                            name="logo-google"
                            size={22}
                            color="#EA4335"
                          />
                        </View>
                      )}
                      {m.kind === "apple" && (
                        <Ionicons name="logo-apple" size={20} color="#111827" />
                      )}
                      {m.kind === "card" && (
                        <View className="w-8 h-8 rounded-full bg-violet-50 items-center justify-center">
                          <Ionicons name="card" size={18} color="#7C3AED" />
                        </View>
                      )}
                    </View>

                    {/* texts */}
                    <View className="ml-4 flex-1">
                      <Text className="font-semibold text-[#111827]">
                        {m.label}
                      </Text>
                      <Text className="text-sm text-gray-400 mt-1">
                        {m.subtitle}
                      </Text>
                      <Text className="text-sm text-violet-600 mt-1">
                        {m.balance}
                      </Text>
                    </View>

                    {/* radio */}
                    <View className="ml-3">
                      <View
                        className={`w-6 h-6 rounded-full items-center justify-center ${isSelected ? "bg-[#7C3AED]" : "bg-white border border-gray-300"}`}>
                        {isSelected ? (
                          <View className="w-2 h-2 rounded-full bg-white" />
                        ) : null}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Confirm Payment bar */}
        <BottomNavBar
          variant="buttonOnly"
          ctaLabel="Confirm Payment"
          onCTAPress={onConfirm}
        />
      </View>
    </SafeAreaView>
  );
}
