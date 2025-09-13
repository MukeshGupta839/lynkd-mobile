// components/Product/QuickActions.tsx
import { usePathname, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

type TabKey = "products" | "services" | "bookings" | "pay";

const TAB_COLORS: Record<TabKey, string> = {
  products: "#26FF91",
  services: "#1B19A8",
  bookings: "#A75AE4",
  pay: "#532ADB",
};

// Active/Inactive images
const TAB_IMAGES: Record<TabKey, { active: any; inactive: any }> = {
  products: {
    active: require("../../assets/images/productquick1.png"),
    inactive: require("../../assets/images/productquick.png"),
  },
  services: {
    active: require("../../assets/images/servicesquick1.png"),
    inactive: require("../../assets/images/servicesquick.png"),
  },
  bookings: {
    active: require("../../assets/images/bookingquick1.png"),
    inactive: require("../../assets/images/bookingquick.png"),
  },
  pay: {
    active: require("../../assets/images/payquick1.png"),
    inactive: require("../../assets/images/payquick.png"),
  },
};

/** 🔹 Label with rules per tab */
function LabelForTab({ tab, active }: { tab: TabKey; active: boolean }) {
  if (tab === "products") {
    return (
      <Text className="mt-2 text-center font-extrabold text-xs text-black">
        PRODUCTS
      </Text>
    );
  }
  if (tab === "services") {
    return (
      <Text
        className={`mt-2 text-center font-extrabold text-xs ${
          active ? "text-white" : "text-black"
        }`}>
        SERVICES
      </Text>
    );
  }
  if (tab === "bookings") {
    if (active) {
      return (
        <Text className="mt-2 text-center font-extrabold text-xs text-white">
          BOOKINGS
        </Text>
      );
    }
    return (
      <Text className="mt-2 text-center font-extrabold text-xs text-black">
        B<Text className="text-[#6C63FF]">OO</Text>KINGS
      </Text>
    );
  }
  return (
    <Text
      className={`mt-2 text-center font-extrabold text-xs ${
        active ? "text-white" : "text-black"
      }`}>
      PAY
    </Text>
  );
}

/** 🔹 Single Card */
function ActionCard({
  tab,
  active,
  onPress,
}: {
  tab: TabKey;
  active: boolean;
  onPress: () => void;
}) {
  const imageSource = active
    ? TAB_IMAGES[tab].active
    : TAB_IMAGES[tab].inactive;
  const bgColor = active ? TAB_COLORS[tab] : "#FFFFFF";

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#00000010" }}
      accessibilityRole="button"
      accessibilityLabel={`Open ${tab}`}
      accessibilityState={{ selected: active }}
      className="flex-1 min-w-0 aspect-square rounded-xl items-center justify-center p-2"
      style={{
        backgroundColor: bgColor,
      }}>
      <Image source={imageSource} className="w-9 h-9" resizeMode="contain" />
      <LabelForTab tab={tab} active={active} />
    </Pressable>
  );
}

/** 🔹 Main QuickActions row */
export default function QuickActions() {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState<TabKey>("products");

  useEffect(() => {
    if (!pathname) return;
    if (pathname.includes("/product")) setActive("products");
    else if (pathname.includes("/services")) setActive("services");
    else if (pathname.includes("/bookings")) setActive("bookings");
    else if (pathname.includes("/pay")) setActive("pay");
  }, [pathname]);

  return (
    <View>
      <View className="py-2 flex-row gap-x-3">
        <ActionCard
          tab="products"
          active={active === "products"}
          onPress={() => router.push("/(tabs)/product")}
        />
        <ActionCard
          tab="services"
          active={active === "services"}
          onPress={() => router.push("/(tabs)/services")}
        />
        <ActionCard
          tab="bookings"
          active={active === "bookings"}
          onPress={() => router.push("/(tabs)/bookings")}
        />
        <ActionCard
          tab="pay"
          active={active === "pay"}
          onPress={() => router.push("/(tabs)/pay")}
        />
      </View>
    </View>
  );
}
