import Ionicons from "@expo/vector-icons/Ionicons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import React from "react";
import { Image, Platform, TouchableOpacity, View } from "react-native";

type Props = BottomTabBarProps & {
  hidden?: boolean;
  avatarUri?: string | null;
};

// map file/route names -> icons
const iconFor = (name: string, focused: boolean) => {
  switch (name) {
    case "index":
    case "home":
      return focused ? "home" : "home-outline";
    case "posts":
      return focused ? "play" : "play-outline";
    case "shop":
      return focused ? "bag" : "bag-outline";
    case "chat":
      return focused ? "chatbox" : "chatbox-outline";
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
  if (hidden) return null;

  const routesLeft = state.routes.filter((r) => r.name !== "profile");
  const profileRoute = state.routes.find((r) => r.name === "profile");

  const onPress = (route: (typeof state.routes)[number], index: number) => {
    const isFocused = state.index === index;
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
        {routesLeft.map((route) => {
          const index = state.routes.indexOf(route);
          const isFocused = state.index === index;
          const testId =
            (descriptors[route.key].options as { tabBarTestID?: string })
              .tabBarTestID ?? `tab-${route.name}`;

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
                name={iconFor(route.name, isFocused)}
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
                    name={iconFor("profile", isFocused)}
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
