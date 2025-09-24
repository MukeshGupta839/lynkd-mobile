import "expo-dev-client";
import App from "expo-router/entry"; // ✅ fixed import
import { AppRegistry } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { registerBackgroundHandler } from "./utils/fcm";

// Must be called before AppRegistry.registerComponent
registerBackgroundHandler();

function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <App />
    </GestureHandlerRootView>
  );
}

AppRegistry.registerComponent("main", () => Root);
