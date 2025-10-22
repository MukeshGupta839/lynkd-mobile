// lib/tabBarVisibility.ts
import { makeMutable } from "react-native-reanimated";

// global shared value that works outside hooks
export const tabBarHiddenSV = makeMutable(false);
// shared flag to indicate when the camera/post underlay is active
export const cameraActiveSV = makeMutable(false);

// Tab press event handlers
type TabPressHandler = {
  scrollToTop: () => void;
  refresh: () => void;
};

const tabPressHandlers: Record<string, TabPressHandler | null> = {};

export const registerTabPressHandler = (
  routeName: string,
  handler: TabPressHandler
) => {
  tabPressHandlers[routeName] = handler;
};

export const unregisterTabPressHandler = (routeName: string) => {
  tabPressHandlers[routeName] = null;
};

export const handleTabPress = (routeName: string, isDoubleTap: boolean) => {
  const handler = tabPressHandlers[routeName];
  if (handler) {
    if (isDoubleTap) {
      handler.refresh();
    } else {
      handler.scrollToTop();
    }
  }
};
