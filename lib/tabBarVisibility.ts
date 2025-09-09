// lib/tabBarVisibility.ts
import { makeMutable } from "react-native-reanimated";

// global shared value that works outside hooks
export const tabBarHiddenSV = makeMutable(false);
