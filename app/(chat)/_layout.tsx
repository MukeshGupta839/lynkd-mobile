import { useSocket } from "@/context/SocketProvider";
import { useAuth } from "@/hooks/useAuth";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function ChatLayout() {
  const { socket } = useSocket();
  const { user } = useAuth();
  useEffect(() => {
    if (!socket || !user?.id) return;

    // 1) A generic notification arrives (could be "postNotification", "friendRequest", etc).
    const handleChat = ({ payload }: { payload: any }) => {
      console.log("Received chat payload:", payload);
    };

    const wrappedIncoming = (payload: any) => {
      console.log("wrappedIncoming payload:", payload);
    };

    const handleStatus = (statusUpdate: any) => {
      console.log("👀 userStatus event:", statusUpdate);
    };

    // 4) Wire up your socket events:
    socket.on("receiveMessage", handleChat);
    socket.on("message", wrappedIncoming);
    socket.on("newMessage", wrappedIncoming);
    socket.on("userStatus", handleStatus);

    return () => {
      socket.off("receiveMessage", handleChat);
      socket.off("message", wrappedIncoming);
      socket.off("newMessage", wrappedIncoming);
      socket.off("userStatus", handleStatus);
    };
  }, [socket, user?.id]);
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="Search"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ChatOptionsBottomSheet"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="chatPost"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
