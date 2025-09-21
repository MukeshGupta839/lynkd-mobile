import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: Platform.OS === "ios" ? "modal" : "transparentModal",
        animation: "slide_from_bottom",
        // avoids white flash on Android while animating over previous screen
        contentStyle: { backgroundColor: "transparent" },
        gestureEnabled: true, // iOS: swipe down to close
      }}
    >
      <Stack.Screen name="post-create" options={{ headerShown: false }} />
    </Stack>
  );
}
