import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// This should match the HEIGHT constant in CustomTabBar.tsx
const TAB_BAR_HEIGHT = 56;

/**
 * Hook to get the total height of the custom tab bar
 * @returns The total height of the tab bar including safe area bottom inset
 */
export const useTabBarHeight = () => {
  const insets = useSafeAreaInsets();
  return (
    TAB_BAR_HEIGHT +
    (Platform.OS === "ios" ? insets.bottom - 12 : insets.bottom)
  );
};

/**
 * Hook to get just the tab bar height without safe area
 * @returns The tab bar height without safe area insets
 */
export const useTabBarBaseHeight = () => {
  return TAB_BAR_HEIGHT;
};
