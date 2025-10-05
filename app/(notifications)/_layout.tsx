import { Stack } from "expo-router";

export default function CommentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="ecommerceNotifications"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
