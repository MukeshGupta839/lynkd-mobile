import CustomTabBar from "@/components/CustomTabBar";
import StatusModal from "@/components/StatusModal";
import { useAuth } from "@/hooks/useAuth";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useState } from "react";

export default function TabLayout() {
  const { user } = useAuth();
  const [statusOpen, setStatusOpen] = useState(false);

  console.log("user:", user, user?.profile_picture);
  return (
    <>
      <Tabs
        tabBar={(props) => (
          <CustomTabBar
            {...props}
            avatarUri={user?.profile_picture}
            onDisabledTabPress={() => setStatusOpen(true)}
            // disabledTabs={["product", "chat"]}
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
