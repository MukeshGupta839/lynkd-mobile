// lib/tabBarVisibility.ts
import { makeMutable } from "react-native-reanimated";

// global shared value that works outside hooks
export const tabBarHiddenSV = makeMutable(false);
// shared flag to indicate when the camera/post underlay is active
export const cameraActiveSV = makeMutable(false);
