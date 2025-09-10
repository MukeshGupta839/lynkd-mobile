import { useRef } from "react";
import { useSharedValue } from "react-native-reanimated";
import { create } from "zustand";

interface TabBarStore {
  isTabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
  shouldHideTabBar: boolean;
  setShouldHideTabBar: (should: boolean) => void;
}

export const useTabBarStore = create<TabBarStore>((set) => ({
  isTabBarVisible: true,
  setTabBarVisible: (visible: boolean) => set({ isTabBarVisible: visible }),
  shouldHideTabBar: false,
  setShouldHideTabBar: (should: boolean) => set({ shouldHideTabBar: should }),
}));

// Hook to get a stable reference to the animated value
export const useTabBarAnimatedValue = () => {
  const animatedValue = useRef(useSharedValue(0)).current;
  return animatedValue;
};
