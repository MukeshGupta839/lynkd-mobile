import "expo-dev-client";
import App from "expo-router/entry"; // ✅ fixed import
import { AppRegistry } from "react-native";
import { registerBackgroundHandler } from "./utils/fcm";

// Must be called before AppRegistry.registerComponent
registerBackgroundHandler();

AppRegistry.registerComponent("main", () => App);
