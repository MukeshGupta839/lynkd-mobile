import CustomTabBar from "@/components/CustomTabBar";
import StatusModal from "@/components/StatusModal";
import { useSocket } from "@/context/SocketProvider";
import { useAuth } from "@/hooks/useAuth";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";

export default function TabLayout() {
  const { user } = useAuth();
  const [statusOpen, setStatusOpen] = useState(false);

  const { socket } = useSocket();
  useEffect(() => {
    if (!socket || !user?.id) return;

    // 1) A generic notification arrives (could be "postNotification", "friendRequest", etc).
    const handleChat = (message: any) => {
      console.log("Received chat message:", message);
      // if you want specific fields:
      // const { id, sender_id, receiver_id, content } = message;
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

  console.log("user:", user, user?.profile_picture);
  return (
    <>
      <Tabs
        tabBar={(props) => (
          <CustomTabBar
            {...props}
            avatarUri={user?.profile_picture}
            onDisabledTabPress={() => setStatusOpen(true)}
            // disabledTabs={["product"]}
          />
        )}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
        }}
      >
        {/* === Main App Tabs === */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={28}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="posts"
          options={{
            title: "Posts",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "play" : "play-outline"}
                size={28}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="product"
          options={{
            title: "Product",
            tabBarIcon: ({ color, focused }) => {
              // choose filled vs outline
              const iconName = focused ? "bag" : "bag-outline";
              return <Ionicons name={iconName} size={28} color={color} />;
            },
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: "Categories",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "grid" : "grid-outline"}
                size={28}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: "Cart",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "cart" : "cart-outline"}
                size={28}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "chatbox" : "chatbox-outline"}
                size={28}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={28}
                color={color}
              />
            ),
          }}
        />

        {/* Products are already declared earlier (product, categories, cart) */}

        {/* === Shop: Services === */}
        <Tabs.Screen
          name="services"
          options={{
            title: "Services Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={28}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="servicesCategories"
          options={{
            title: "Services Categories",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "grid" : "grid-outline"}
                size={28}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="servicesHistory"
          options={{
            title: "Services History",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "time" : "time-outline"}
                size={28}
                color={color}
              />
            ),
          }}
        />

        {/* === Shop: Bookings === */}
        <Tabs.Screen
          name="bookings"
          options={{
            title: "Bookings Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "calendar" : "calendar-outline"}
                size={28}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="bookingsFavourites"
          options={{
            title: "Bookings Favourites",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "heart" : "heart-outline"}
                size={28}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="bookingsTickets"
          options={{
            title: "Bookings Tickets",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "ticket" : "ticket-outline"}
                size={28}
                color={color}
              />
            ),
          }}
        />

        {/* === Shop: Pay === */}
        <Tabs.Screen
          name="pay"
          options={{
            title: "Pay Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "card" : "card-outline"}
                size={28}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="payScanner"
          options={{
            title: "Pay Scanner",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "camera" : "camera-outline"}
                size={28}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="payHistory"
          options={{
            title: "Pay History",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "time" : "time-outline"}
                size={28}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      <StatusModal
        visible={statusOpen}
        onClose={() => setStatusOpen(false)}
        showImage={false}
        showHeading={false}
        showDescription={true}
        description="This feature is not available right now it will be available soon"
        showButton={false}
      />
    </>
  );
}
