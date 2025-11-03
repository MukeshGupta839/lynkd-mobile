import { Stack } from "expo-router";
export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profilePosts" options={{ headerShown: false }} />
      <Stack.Screen name="editProfile" options={{ headerShown: false }} />
      <Stack.Screen name="InviteHome" options={{ headerShown: false }} />
      <Stack.Screen name="ViewInvites" options={{ headerShown: false }} />
      <Stack.Screen name="userReels" options={{ headerShown: false }} />
    </Stack>
  );
}
