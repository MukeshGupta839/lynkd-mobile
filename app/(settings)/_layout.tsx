import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="changePassword"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="analytics-coming-soon"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="favorites"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="instagramVerification"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="agencyInvites"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
