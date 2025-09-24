// components/CustomTabBar.tsx
import { tabBarHiddenSV } from "@/lib/tabBarVisibility";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Camera } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  FlatListProps,
  Image,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
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

  if (hidden) return null;

  const findRouteByName = (name: string) =>
    state.routes.find((r) => r.name === name);

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

  const onSlotPress = (slot: string) => {
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
          accessibilityLabel={(() => {
            const rn = SLOT_TO_ROUTE[slot];
            const dest = rn ? findRouteByName(rn) : undefined;
            return dest
              ? ((descriptors[dest.key].options
                  .tabBarAccessibilityLabel as string) ?? "Scanner")
              : "Scanner";
          })()}
          accessibilityState={focused ? { selected: true } : {}}
        >
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
        accessibilityState={focused ? { selected: true } : {}}
      >
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
    <Animated.View
      style={{ position: "absolute", left: 0, right: 0, bottom: 0 } as any}
    >
      <Animated.View style={slideStyle}>
        <View
          className={`flex-row ${Platform.OS === "ios" ? "-pb-safe-offset-3" : "pb-safe"}`}
        >
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
              accessibilityState={profileFocused ? { selected: true } : {}}
            >
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
      </Animated.View>
    </Animated.View>
  );
}

/* ---------- ADDED: scroll-aware FlatList exported from this file ---------- */

/**
 * ScrollAwareFlatList
 *
 * Use this in your index.tsx (or any screen) in place of FlatList.
 * It will set tabBarHiddenSV.value = true when user scrolls DOWN (content moves up),
 * and set it = false when user scrolls UP (content moves down).
 *
 * Example usage:
 * import { ScrollAwareFlatList } from "@/components/CustomTabBar";
 * <ScrollAwareFlatList data={...} renderItem={...} />
 */

type ScrollAwareFlatListProps<ItemT> = FlatListProps<ItemT> & {
  /**
   * threshold px to ignore tiny deltas
   */
  threshold?: number;
  /**
   * whether to only allow hide on index tab; default true keeps same behavior as tabbar
   * set to false to let this component request hide for any route (tabbar itself still checks index)
   */
  onlyWhenIndex?: boolean;
};

export function ScrollAwareFlatList<ItemT = any>({
  threshold = 6,
  onlyWhenIndex = true,
  ...props
}: ScrollAwareFlatListProps<ItemT>) {
  // keep previous offset to determine direction (UI-thread)
  const prevY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const dy = y - prevY.value;

      // ignore tiny movements
      if (Math.abs(dy) < threshold) {
        prevY.value = y;
        return;
      }

      // Important: tabBarHiddenSV is boolean-typed in your lib, so assign booleans directly.
      // The Animated tab bar will perform the actual translateY animation using withTiming
      // when it reads tabBarHiddenSV.value.
      if (dy > 0) {
        // user scrolled DOWN (content moves up) -> request hide
        tabBarHiddenSV.value = true;
      } else {
        // user scrolled UP (content moves down) -> request show
        tabBarHiddenSV.value = false;
      }

      prevY.value = y;
    },
  });

  const AnimatedFL = Animated.createAnimatedComponent(
    FlatList
  ) as typeof FlatList;

  return (
    <AnimatedFL
      {...(props as any)}
      onScroll={onScroll}
      scrollEventThrottle={16}
    />
  );
}
