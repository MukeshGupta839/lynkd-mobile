// components/CustomTabBar.tsx
import { tabBarHiddenSV } from "@/lib/tabBarVisibility";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Camera } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Platform, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = BottomTabBarProps & {
  hidden?: boolean;
  avatarUri?: string | null;
};

/**
 * Config
 */
const SECTION_SLOTS: Record<string, string[]> = {
  main: ["index", "posts", "product", "chat"],
  products: ["back", "products-home", "products-categories", "products-cart"],
  services: [
    "back",
    "services-home",
    "services-categories",
    "services-history",
  ],
  bookings: [
    "back",
    "bookings-home",
    "bookings-favourites",
    "bookings-tickets",
  ],
  pay: ["back", "pay-home", "pay-scanner", "pay-history"],
};

const SLOT_ICON: Record<
  string,
  { filled: string | null; outline: string | null }
> = {
  back: { filled: "arrow-back", outline: "arrow-back" },
  index: { filled: "home", outline: "home-outline" },
  posts: { filled: "play", outline: "play-outline" },
  product: { filled: "bag", outline: "bag-outline" },
  chat: { filled: "chatbox", outline: "chatbox-outline" },

  "products-home": { filled: "home", outline: "home-outline" },
  "products-categories": { filled: "grid", outline: "grid-outline" },
  "products-cart": { filled: "cart", outline: "cart-outline" },

  "services-home": { filled: "home", outline: "home-outline" },
  "services-categories": { filled: "grid", outline: "grid-outline" },
  "services-history": {
    filled: "document-text",
    outline: "document-text-outline",
  },

  "bookings-home": { filled: "home", outline: "home-outline" },
  "bookings-favourites": { filled: "heart", outline: "heart-outline" },
  "bookings-tickets": { filled: "ticket", outline: "ticket-outline" },

  "pay-home": { filled: "home", outline: "home-outline" },
  "pay-camera": { filled: "camera", outline: "camera-outline" },
  "pay-history": { filled: "card", outline: "card-outline" },

  profile: { filled: "person-circle", outline: "person-circle-outline" },
};

const SHOP_ROUTE_NAMES = new Set([
  "product",
  "categories",
  "cart",
  "services",
  "servicesCategories",
  "servicesHistory",
  "bookings",
  "bookingsFavourites",
  "bookingsTickets",
  "pay",
  "payScanner",
  "payHistory",
]);

/**
 * Important: explicit mapping from logical slot -> actual route name (registered in your navigator)
 * This avoids brittle regex hacks and ensures navigation.navigate() receives valid route names.
 */
const SLOT_TO_ROUTE: Record<string, string> = {
  // main
  index: "index",
  posts: "posts",
  product: "product",
  chat: "chat",

  // products
  "products-home": "product",
  "products-categories": "categories",
  "products-cart": "cart",

  // services
  "services-home": "services",
  "services-categories": "servicesCategories",
  "services-history": "servicesHistory",

  // bookings
  "bookings-home": "bookings",
  "bookings-favourites": "bookingsFavourites",
  "bookings-tickets": "bookingsTickets",

  // pay
  "pay-home": "pay",
  "pay-scanner": "payScanner",
  "pay-history": "payHistory",

  // profile (for profile bubble)
  profile: "profile",
};

const HEIGHT = 56; // your bar height

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
  hidden,
  avatarUri,
}: Props) {
  const [wasInShop, setWasInShop] = useState(false);

  const currentRoute = state.routes[state.index];
  const currentName = currentRoute?.name ?? "";

  const isDirectlyInShop = SHOP_ROUTE_NAMES.has(currentName);

  useEffect(() => {
    if (isDirectlyInShop) setWasInShop(true);
    else if (currentName !== "profile") setWasInShop(false);
  }, [currentName, isDirectlyInShop]);

  const isShopActive =
    isDirectlyInShop || (currentName === "profile" && wasInShop);

  const insets = useSafeAreaInsets();

  // derive “am I on index tab?” as a shared value so worklets can read it
  const isIndexSV = useSharedValue(state.routes[state.index]?.name === "index");
  const offscreenSV = useSharedValue(HEIGHT + insets.bottom);

  useEffect(() => {
    isIndexSV.value = state.routes[state.index]?.name === "index";
  }, [state.index, state.routes, isIndexSV]);

  useEffect(() => {
    offscreenSV.value = HEIGHT + insets.bottom;
  }, [insets.bottom, offscreenSV]);

  // slide down when (isIndex && tabBarHiddenSV)
  const slideStyle = useAnimatedStyle(() => {
    const shouldHide = isIndexSV.value && tabBarHiddenSV.value;
    const ty = withTiming(shouldHide ? offscreenSV.value : 0, {
      duration: 180,
    });
    return { transform: [{ translateY: ty }] };
  });

  if (hidden) return null;

  // which slot set to show
  const shopSection = useMemo(() => {
    if (!isShopActive) return "main";
    if (["product", "categories", "cart"].includes(currentName))
      return "products";
    if (
      ["services", "servicesCategories", "servicesHistory"].includes(
        currentName
      )
    )
      return "services";
    if (
      ["bookings", "bookingsFavourites", "bookingsTickets"].includes(
        currentName
      )
    )
      return "bookings";
    if (["pay", "payScanner", "payHistory"].includes(currentName)) return "pay";
    return "products";
  }, [currentName, isShopActive]);

  const slots = SECTION_SLOTS[shopSection] ?? SECTION_SLOTS.main;

  // find route object by name (helper)
  const findRouteByName = (name: string) =>
    state.routes.find((r) => r.name === name);

  // main navigation: emit tabPress then navigate (keeps behavior and listeners)
  const navigateToRouteName = (routeName: string) => {
    const dest = findRouteByName(routeName);
    const targetKey = dest?.key;
    const event = navigation.emit({
      type: "tabPress",
      target: targetKey,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(routeName as any);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  // slot press uses explicit mapping
  const onSlotPress = (slot: string) => {
    // haptic immediate
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (slot === "back") {
      navigateToRouteName("index");
      return;
    }

    const routeName = SLOT_TO_ROUTE[slot];
    if (routeName) {
      navigateToRouteName(routeName);
    }
  };

  // focused logic: which slot should appear active
  const isSlotFocused = (slot: string) => {
    if (!isShopActive) {
      const route = state.routes[state.index];
      if (!route) return false;
      if (slot === "index")
        return route.name === "index" || route.name === "home";
      return route.name === slot;
    }

    // shop-mode comparisons
    switch (slot) {
      case "products-home":
        return currentName === "product";
      case "products-categories":
        return currentName === "categories";
      case "products-cart":
        return currentName === "cart";
      case "services-home":
        return currentName === "services";
      case "services-categories":
        return currentName === "servicesCategories";
      case "services-history":
        return currentName === "servicesHistory";
      case "bookings-home":
        return currentName === "bookings";
      case "bookings-favourites":
        return currentName === "bookingsFavourites";
      case "bookings-tickets":
        return currentName === "bookingsTickets";
      case "pay-home":
        return currentName === "pay";
      case "pay-scanner":
        return currentName === "payScanner";
      case "pay-history":
        return currentName === "payHistory";
      default:
        return false;
    }
  };

  const renderSlotButton = (slot: string, idx: number) => {
    const focused = isSlotFocused(slot);

    // scanner uses lucide icon
    if (slot === "pay-scanner") {
      return (
        <TouchableOpacity
          key={`${slot}-${idx}`}
          onPress={() => onSlotPress(slot)}
          activeOpacity={0.85}
          className="w-14 h-14 rounded-full items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={
            // if slot maps to a route, try reading its descriptor label
            (() => {
              const rn = SLOT_TO_ROUTE[slot];
              const dest = rn ? findRouteByName(rn) : undefined;
              return dest
                ? ((descriptors[dest.key].options
                    .tabBarAccessibilityLabel as string) ?? "Scanner")
                : "Scanner";
            })()
          }
          accessibilityState={focused ? { selected: true } : {}}>
          <Camera width={28} height={28} color={focused ? "#fff" : "#ccc"} />
        </TouchableOpacity>
      );
    }

    const mapping = SLOT_ICON[slot] ?? {
      filled: "ellipse",
      outline: "ellipse-outline",
    };
    const iconName = focused
      ? (mapping.filled ?? mapping.outline ?? "ellipse")
      : (mapping.outline ?? mapping.filled ?? "ellipse-outline");

    // try to get accessibilityLabel from the destination descriptor if available
    const accessibilityLabel = (() => {
      const rn = SLOT_TO_ROUTE[slot];
      if (!rn) return slot;
      const dest = findRouteByName(rn);
      if (!dest) return slot;
      const opt = descriptors[dest.key]?.options as
        | { tabBarAccessibilityLabel?: string }
        | undefined;
      return opt?.tabBarAccessibilityLabel ?? slot;
    })();

    return (
      <TouchableOpacity
        key={`${slot}-${idx}`}
        onPress={() => onSlotPress(slot)}
        activeOpacity={0.85}
        className="w-14 h-14 rounded-full items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={focused ? { selected: true } : {}}>
        <Ionicons
          name={iconName as any}
          size={25}
          color={focused ? "#fff" : "#ccc"}
        />
      </TouchableOpacity>
    );
  };

  const profileRoute = state.routes.find((r) => r.name === "profile");
  const profileFocused = profileRoute
    ? state.index === state.routes.indexOf(profileRoute)
    : false;

  return (
    <View
      style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
      className={`flex-row ${Platform.OS === "ios" ? "-pb-safe-offset-3" : "pb-safe"}`}>
      {/* Left pill */}
      <View className="flex-1 h-14 bg-black rounded-l-none rounded-2xl flex-row items-center justify-around mr-2 px-2">
        {slots.map((s, i) => renderSlotButton(s, i))}
      </View>

      {/* Profile bubble */}
      {profileRoute ? (
        <TouchableOpacity
          key={profileRoute.key}
          onPress={() => {
            const ev = navigation.emit({
              type: "tabPress",
              target: profileRoute.key,
              canPreventDefault: true,
            });
            if (!ev.defaultPrevented) {
              navigation.navigate("profile" as any);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                () => {}
              );
            }
          }}
          activeOpacity={0.9}
          className="w-14 h-14 rounded-r-none rounded-2xl bg-black border-white items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={
            (
              descriptors[profileRoute.key].options as {
                tabBarAccessibilityLabel?: string;
              }
            ).tabBarAccessibilityLabel ?? "Profile"
          }
          accessibilityState={profileFocused ? { selected: true } : {}}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              className="w-14 h-14 rounded-full"
            />
          ) : (
            <Ionicons
              name={SLOT_ICON.profile.filled as any}
              size={40}
              color={profileFocused ? "#fff" : "#ccc"}
            />
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
