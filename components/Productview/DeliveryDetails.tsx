// components/Productview/DeliveryDetails.tsx
import { Ionicons } from "@expo/vector-icons";
import { PackageCheck, Shield, Truck } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Address = { title: string; details: string };

type Props = {
  addresses: Address[];
  warrantyText: string;
  onCheckPin?: (pin: string) => void; // optional: call your API
};

const Pill = ({
  children,
  tone = "emerald",
}: {
  children: React.ReactNode;
  tone?: "emerald" | "slate" | "blue";
}) => {
  const map = {
    emerald: "bg-emerald-100 border-emerald-300",
    slate: "bg-slate-100 border-slate-300",
    blue: "bg-blue-100 border-blue-300",
  } as const;
  return (
    <View
      className={`flex-row items-center px-2.5 py-1 rounded-full border ${map[tone]} mr-2`}>
      {children}
    </View>
  );
};

export default function DeliveryDetails({
  addresses,
  warrantyText,
  onCheckPin,
}: Props) {
  const [pin, setPin] = useState("");
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [serviceable, setServiceable] = useState<boolean | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const pinValid = /^\d{6}$/.test(pin);

  // simple ETA heuristic (replace with API later)
  const eta = useMemo(() => {
    if (!checked || !serviceable) return null;
    const d = Number(pin[0] || 5);
    if (d <= 3) return "Tomorrow";
    if (d <= 6) return "2–3 days";
    return "3–5 days";
  }, [checked, serviceable, pin]);

  const handleCheck = async () => {
    Keyboard.dismiss();
    if (!pinValid) {
      Alert.alert("Invalid PIN", "Please enter a 6-digit PIN code.");
      return;
    }
    try {
      setChecking(true);
      onCheckPin?.(pin);
      const ok = Number(pin[0]) >= 1 && Number(pin[0]) <= 8;
      await new Promise((r) => setTimeout(r, 280));
      setServiceable(ok);
      setChecked(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <View className="w-full bg-white rounded-2xl p-4 border border-gray-100">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons name="cube-outline" size={18} color="#111827" />
          <Text className="ml-2 text-base font-semibold text-gray-900">
            Delivery Details
          </Text>
        </View>
        {/* Super Fast badge – always visible */}
        <View className="flex-row items-center bg-emerald-100 border border-emerald-300 rounded-full px-2.5 py-1">
          <Truck size={14} color="#065f46" />
          <Text className="ml-1 text-[11px] font-semibold text-emerald-800">
            Super fast delivery
          </Text>
        </View>
      </View>

      {/* PIN row */}
      <View className="flex-row items-center">
        <TextInput
          value={pin}
          onChangeText={(t) => setPin(t.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          placeholder="Enter PIN code"
          placeholderTextColor="#9CA3AF"
          className="flex-1 bg-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800"
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={handleCheck}
          disabled={!pinValid || checking}
          activeOpacity={0.9}
          className={`ml-3 rounded-xl px-4 py-2.5 ${
            !pinValid || checking ? "bg-gray-200" : "bg-emerald-400"
          }`}>
          <Text
            className={`font-semibold ${
              !pinValid || checking ? "text-gray-500" : "text-black"
            }`}>
            {checking ? "Checking…" : "Check"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Delivery speed banner */}
      <View className="mt-3">
        {!checked ? (
          <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#334155"
            />
            <Text className="ml-2 text-[13px] text-slate-700">
              Check your PIN to see exact delivery speed for your area.
            </Text>
          </View>
        ) : serviceable ? (
          <View className="rounded-2xl border border-emerald-300 bg-emerald-50 px-3 py-2">
            <View className="flex-row items-center">
              <Truck size={16} color="#065f46" />
              <Text className="ml-2 text-[13px] font-semibold text-emerald-800">
                Arrives by {eta}
              </Text>
            </View>
            <View className="flex-row mt-2">
              <Pill tone="emerald">
                <Ionicons name="cash-outline" size={12} color="#065f46" />
                <Text className="ml-1 text-[11px] text-emerald-800">
                  COD available
                </Text>
              </Pill>
              <Pill tone="emerald">
                <PackageCheck size={12} color="#065f46" />
                <Text className="ml-1 text-[11px] text-emerald-800">
                  Secure packaging
                </Text>
              </Pill>
              <Pill tone="emerald">
                <Shield size={12} color="#065f46" />
                <Text className="ml-1 text-[11px] text-emerald-800">
                  Easy returns
                </Text>
              </Pill>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <Ionicons name="warning-outline" size={16} color="#b91c1c" />
            <Text className="ml-2 text-[13px] text-red-700">
              Not serviceable at this PIN yet. Try another PIN.
            </Text>
          </View>
        )}
      </View>

      {/* Address list */}
      <View className="mt-3">
        {addresses.map((a, i) => {
          const active = i === selectedIdx;
          return (
            <TouchableOpacity
              key={`${a.title}-${i}`}
              onPress={() => setSelectedIdx(i)}
              activeOpacity={0.9}
              className={`flex-row items-start rounded-2xl px-3 py-3 mb-3 ${
                active
                  ? "bg-emerald-50 border border-emerald-300"
                  : "bg-gray-100 border border-transparent"
              }`}>
              {/* Radio */}
              <View
                className={`h-5 w-5 rounded-full mt-0.5 items-center justify-center ${
                  active ? "bg-emerald-500" : "bg-white border border-gray-300"
                }`}>
                {active ? (
                  <Ionicons name="checkmark" size={12} color="white" />
                ) : null}
              </View>

              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Ionicons name="home-outline" size={16} color="#111827" />
                  <Text className="ml-2 font-semibold text-sm text-gray-900">
                    {a.title}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  className="mt-0.5 text-xs text-gray-600">
                  {a.details}
                </Text>
              </View>

              <TouchableOpacity activeOpacity={0.8}>
                <Text className="text-[12px] font-semibold text-blue-600">
                  Change
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        {/* Add new address CTA (optional) */}
        <TouchableOpacity activeOpacity={0.9} className="self-start">
          <View className="flex-row items-center px-3 py-2 rounded-xl border border-dashed border-gray-300">
            <Ionicons name="add" size={16} color="#111827" />
            <Text className="ml-1 text-[13px] font-semibold text-gray-800">
              Add new address
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Warranty row with Apple logo + link */}
      <View className="mt-3 flex-row items-center bg-gray-100 rounded-2xl px-3 py-3">
        <Ionicons name="logo-apple" size={18} color="#111827" />
        <Text className="ml-2 text-xs text-gray-700 flex-1">
          {warrantyText}
        </Text>
        <TouchableOpacity activeOpacity={0.8}>
          <Text className="text-[12px] font-semibold text-blue-600">
            Know more
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
