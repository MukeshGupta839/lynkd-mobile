import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";
import "../global.css";

import { FavoritesProvider } from "@/context/FavoritesContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  askNotificationPermissionAndGetFcmToken,
  attachForegroundListener,
} from "@/utils/fcm";
import { useEffect } from "react";
import { Alert } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins/Poppins-Light.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins/Poppins-Bold.ttf"),
    "OpenSans-Light": require("../assets/fonts/OpenSans/OpenSans-Light.ttf"),
    "OpenSans-Regular": require("../assets/fonts/OpenSans/OpenSans-Regular.ttf"),
    "OpenSans-Bold": require("../assets/fonts/OpenSans/OpenSans-Bold.ttf"),
    "OpenSans-SemiBold": require("../assets/fonts/OpenSans/OpenSans-SemiBold.ttf"),
    "OpenSans-Italic": require("../assets/fonts/OpenSans/OpenSans-Italic.ttf"),
    "OpenSans-SemiBoldItalic": require("../assets/fonts/OpenSans/OpenSans-SemiBoldItalic.ttf"),
    "OpenSans-BoldItalic": require("../assets/fonts/OpenSans/OpenSans-BoldItalic.ttf"),
  });

  useEffect(() => {
    let unsub: undefined | (() => void);
    (async () => {
      const token = await askNotificationPermissionAndGetFcmToken();
      console.log("[FCM] device token:", token);
      // send token to your backend if you have a user
      unsub = attachForegroundListener((rm) => {
        const title = rm?.notification?.title ?? "Notification";
        const body = rm?.notification?.body ?? "You have a new message.";
        Alert.alert(title, body);
      });
    })();
    return () => {
      unsub?.();
    };
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <KeyboardProvider>
          <FavoritesProvider>
            <Stack screenOptions={{ animation: "slide_from_right" }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="(profiles)"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(compose)"
                options={{
                  animation: "slide_from_bottom",
                  contentStyle: { backgroundColor: "transparent" },
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="Address/selectAddress"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Address/AddAddress"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Address/ShippingAddress"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Searchscreen"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Product/Productview"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Product/ReviewOrder"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Product/payments"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Bookings/UpcomingEvents"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Bookings/PopularEvents"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Bookings/Booking"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Bookings/BookingForm"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Bookings/Details"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Bookings/Payments"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Bookings/sucess"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Bookings/[ticketId]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Notifications"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Services/serviceDetails"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Services/BookingTable"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Services/PersonalDetails"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Services/Receipt"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </FavoritesProvider>
        </KeyboardProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
