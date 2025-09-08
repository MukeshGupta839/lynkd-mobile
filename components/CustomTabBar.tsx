import Ionicons from "@expo/vector-icons/Ionicons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Image, Platform, TouchableOpacity, View } from "react-native";

type Props = BottomTabBarProps & {
  hidden?: boolean;
  avatarUri?: string | null;
};

// map file/route names -> icons
const iconFor = (
  name: string,
  focused: boolean,
  isShopActive: boolean = false
) => {
  // When shop is active, change the icons for certain tabs
  if (isShopActive) {
    switch (name) {
      case "index":
      case "product":
        return focused ? "home" : "home-outline"; // Product shows as home
      case "categories":
        return focused ? "grid" : "grid-outline"; // Categories icon
      case "cart":
        return focused ? "cart" : "cart-outline"; // Cart icon instead of categories
      case "profile":
        return focused ? "person-circle-outline" : "person-circle-outline";
      default:
        return focused ? "ellipse" : "ellipse-outline";
    }
  }

  // Normal state icons
  switch (name) {
    case "index":
    case "home":
      return focused ? "home" : "home-outline";
    case "posts":
      return focused ? "play" : "play-outline";
    case "product":
      return focused ? "bag" : "bag-outline";
    case "chat":
      return focused ? "chatbox" : "chatbox-outline";
    case "cart":
      return undefined; // Cart should not show in normal state
    case "categories":
      return undefined; // Categories should not show in normal state
    case "profile":
      return focused ? "person-circle-outline" : "person-circle-outline";
    default:
      return focused ? "ellipse" : "ellipse-outline";
  }
};

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
  hidden,
  avatarUri,
}: Props) {
  // State to track if we're in product context (must be before any early returns)
  const [wasInProductContext, setWasInProductContext] = useState(false);

  // Check if product tab is currently active (including product-related screens)
  const currentRoute = state.routes[state.index];
  const isDirectlyInProduct =
    currentRoute?.name === "product" ||
    currentRoute?.name === "categories" ||
    currentRoute?.name === "cart";

  // Update product context state
  useEffect(() => {
    if (isDirectlyInProduct) {
      setWasInProductContext(true);
    } else if (currentRoute?.name !== "profile") {
      // Reset product context when navigating to non-product, non-profile tabs
      setWasInProductContext(false);
    }
  }, [currentRoute?.name, isDirectlyInProduct]);

  const isShopActive =
    isDirectlyInProduct ||
    (currentRoute?.name === "profile" && wasInProductContext);

  if (hidden) return null;

  const routesLeft = state.routes.filter((r) => r.name !== "profile");
  const profileRoute = state.routes.find((r) => r.name === "profile");

  const onPress = (route: (typeof state.routes)[number], index: number) => {
    const isFocused = state.index === index;

    // Special handling when product is active
    if (isShopActive) {
      // Handle navigation based on the modified icons
      if (route.name === "categories") {
        // Categories tab navigation
        const event = navigation.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });
        if (!event.defaultPrevented) {
          navigation.navigate("categories");
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {}
          );
        }
        return;
      }
      if (route.name === "cart") {
        // Cart tab navigation
        const event = navigation.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });
        if (!event.defaultPrevented) {
          navigation.navigate("cart");
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {}
          );
        }
        return;
      }
      if (route.name === "posts") {
        // Posts tab now acts as home when product is active
        navigation.navigate("index");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        return;
      }
      if (route.name === "chat") {
        // Chat tab now acts as cart when product is active
        // You can navigate to a cart screen or handle cart functionality here
        console.log("Navigate to cart");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        return;
      }
      if (route.name === "product") {
        // Product tab navigation - always navigate to product when clicked
        const event = navigation.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });
        if (!event.defaultPrevented) {
          navigation.navigate("product");
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {}
          );
        }
        return;
      }
    }

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  return (
    <View
      className={`absolute left-0 right-0 bottom-0 flex-row ${Platform.OS === "ios" ? " -pb-safe-offset-3" : "pb-safe"}`}
    >
      {/* Left pill with all tabs except Profile */}
      <View className="flex-1 h-14 bg-black rounded-l-none rounded-2xl flex-row items-center justify-around mr-2 px-2">
        {/* Show back button when product is active */}
        {isShopActive && (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("index"); // Navigate back to home
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                () => {}
              );
            }}
            activeOpacity={0.85}
            className="w-14 h-14 rounded-full items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Back to home"
          >
            <Ionicons name="arrow-back" size={25} color="#fff" />
          </TouchableOpacity>
        )}

        {routesLeft.map((route) => {
          const index = state.routes.indexOf(route);
          const isFocused = state.index === index;
          const testId =
            (descriptors[route.key].options as { tabBarTestID?: string })
              .tabBarTestID ?? `tab-${route.name}`;

          // When product is active, only show product (as home), categories, and cart
          if (isShopActive) {
            if (
              route.name !== "product" &&
              route.name !== "categories" &&
              route.name !== "cart"
            ) {
              return null;
            }
          } else {
            // Normal state - hide cart tab and index/home tab when product is active and back button is shown
            if (route.name === "cart" || route.name === "categories") {
              return null; // Hide cart tab in normal state
            }
            if (
              isShopActive &&
              (route.name === "index" || route.name === "home")
            ) {
              return null;
            }
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => onPress(route, index)}
              activeOpacity={0.85}
              className="w-14 h-14 rounded-full items-center justify-center"
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={
                descriptors[route.key].options.tabBarAccessibilityLabel
              }
              testID={testId}
            >
              <Ionicons
                name={iconFor(route.name, isFocused, isShopActive)}
                size={25}
                color={isFocused ? "#fff" : "#ccc"}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Right avatar bubble = Profile tab */}
      {profileRoute
        ? (() => {
            const index = state.routes.indexOf(profileRoute);
            const isFocused = state.index === index;
            return (
              <TouchableOpacity
                key={profileRoute.key}
                onPress={() => onPress(profileRoute, index)}
                activeOpacity={0.9}
                className="w-14 h-14 rounded-r-none rounded-2xl bg-black border-white items-center justify-center"
              >
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    className="w-14 h-14 rounded-full"
                  />
                ) : (
                  <Ionicons
                    name={iconFor("profile", isFocused, isShopActive)}
                    size={40}
                    color={isFocused ? "#fff" : "#ccc"}
                  />
                )}
              </TouchableOpacity>
            );
          })()
        : null}
    </View>
  );
}
