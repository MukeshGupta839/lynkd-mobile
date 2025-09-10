import { usePathname, useRouter } from "expo-router";
import {
  Building2,
  Calendar,
  Circle,
  DollarSign,
  LayoutGrid,
  Star,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type TabKey = "products" | "services" | "bookings" | "pay";

function ActionCard({
  active,
  onPress,
  bgActive = "bg-green-500",
  bgInactive = "bg-white",
  icon,
  label,
}: {
  active: boolean;
  onPress: () => void;
  bgActive?: string;
  bgInactive?: string;
  icon: React.ReactNode;
  label: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className={`w-[22%] aspect-square rounded-xl items-center justify-center pt-2 pb-2 px-2 shadow-md ${
        active ? bgActive : bgInactive
      }`}>
      {icon}
      <Text className="mt-2 w-full text-center leading-tight font-extrabold italic text-xs text-black">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function QuickActionsWithSearch() {
  const router = useRouter();
  const pathname = usePathname();

  // detect active tab from current route
  const [active, setActive] = useState<TabKey>("products");
  useEffect(() => {
    if (pathname.includes("/product")) setActive("products");
    else if (pathname.includes("/services")) setActive("services");
    else if (pathname.includes("/bookings")) setActive("bookings");
    else if (pathname.includes("/pay")) setActive("pay");
  }, [pathname]);

  return (
    <View className="bg-transparent">
      <View className="py-3">
        <View className="flex-row items-stretch justify-between">
          {/* PRODUCTS */}
          <ActionCard
            active={active === "products"}
            onPress={() => router.push("/(tabs)/product")}
            icon={
              <LayoutGrid
                size={26}
                color="black"
                fill={active === "products" ? "black" : "transparent"}
              />
            }
            label={"PRODUCTS"}
          />

          {/* SERVICES */}
          <ActionCard
            active={active === "services"}
            onPress={() => router.push("/(tabs)/services")}
            icon={
              <View className="items-center">
                <Building2
                  size={26}
                  color="#6C63FF"
                  fill={active === "services" ? "#fff" : "transparent"}
                />
                <View className="h-1 w-8 bg-pink-500 rounded-full mt-1" />
              </View>
            }
            label={"SERVICES"}
          />

          {/* BOOKINGS */}
          <ActionCard
            active={active === "bookings"}
            onPress={() => router.push("/(tabs)/bookings")}
            icon={
              <View className="items-center justify-center">
                <Calendar
                  size={26}
                  color="#6666FF"
                  fill={active === "bookings" ? "#fff" : "transparent"}
                />
                <View className="absolute top-2 inset-0 flex items-center justify-center">
                  <Star size={10} color="#6666FF" fill="#6666FF" />
                </View>
              </View>
            }
            label={
              <>
                {"B"}
                <Text className="text-[#6C63FF]">OO</Text>
                {"KINGS"}
              </>
            }
          />

          {/* PAY */}
          <ActionCard
            active={active === "pay"}
            onPress={() => router.push("/(tabs)/pay")}
            icon={
              <View className="relative">
                <Circle
                  size={26}
                  strokeWidth={2}
                  color="black"
                  fill={active === "pay" ? "#E9D5FF" : "transparent"}
                />
                <View className="absolute inset-0 flex items-center justify-center">
                  <DollarSign size={14} strokeWidth={2.5} color="#8A38F5" />
                </View>
              </View>
            }
            label={"PAY"}
          />
        </View>
      </View>
    </View>
  );
}
