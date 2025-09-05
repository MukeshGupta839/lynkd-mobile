import CustomTabBar from "@/components/CustomTabBar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  // const hideNavBar = useNavBarStore((s) => s.hideNavBar);
  // const user = useContext(AuthContext);

  return (
    <Tabs
      // render your custom bar (or hide it)
      tabBar={(props) => <CustomTabBar {...props} />}
      // we’re drawing our own bar, so keep RN’s labels etc. off
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      {/* These names must match your files under app/(tabs) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => {
            // choose filled vs outline
            const iconName = focused ? "home" : "home-outline";
            return <Ionicons name={iconName} size={28} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: "Posts",
          tabBarIcon: ({ color, focused }) => {
            // choose filled vs outline
            const iconName = focused ? "chatbox" : "chatbox-outline";
            return <Ionicons name={iconName} size={28} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
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
          tabBarIcon: ({ color, focused }) => {
            // choose filled vs outline
            const iconName = focused ? "grid" : "grid-outline";
            return <Ionicons name={iconName} size={28} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, focused }) => {
            // choose filled vs outline
            const iconName = focused ? "cart" : "cart-outline";
            return <Ionicons name={iconName} size={28} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, focused }) => {
            // choose filled vs outline
            const iconName = focused ? "chatbox" : "chatbox-outline";
            return <Ionicons name={iconName} size={28} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => {
            // choose filled vs outline
            const iconName = focused ? "person" : "person-outline";
            return <Ionicons name={iconName} size={28} color={color} />;
          },
        }}
      />
    </Tabs>
  );
}
