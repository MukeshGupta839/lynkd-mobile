import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { requestAllPermissions } from "@/utils/permissions";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { setVideoCacheSizeAsync } from "expo-video";
import { useEffect } from "react";
import { MD3LightTheme, PaperProvider } from "react-native-paper";

import "../ReactotronConfig";

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  fade: true,
});

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
    (async () => {
      try {
        await setVideoCacheSizeAsync(1_500_000_000); // ~1.5GB
      } catch {
        // ignore if a player already exists
      }
    })();
  }, []);

  // Request all permissions when app opens
  useEffect(() => {
    (async () => {
      try {
        await requestAllPermissions();
      } catch (error) {
        console.error("Error requesting permissions on app start:", error);
      }
    })();
  }, []);

  // Hide splash screen when fonts are loaded
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={MD3LightTheme}>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <BottomSheetModalProvider>
              <KeyboardProvider>
                <AuthProvider>
                  <FavoritesProvider>
                    <Stack
                      screenOptions={{
                        animation: "slide_from_right",
                        contentStyle: { backgroundColor: "#fff" },
                      }}>
                      <Stack.Screen
                        name="index"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="(auth)"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="(tabs)"
                        options={{ headerShown: false, animation: "fade" }}
                      />
                      <Stack.Screen
                        name="(profiles)"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="Store/storeProfile"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="Store/viewShop"
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
                        name="(comment)"
                        options={{ headerShown: false }}
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
                        name="Product/media"
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
                        name="(notifications)"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="(search)"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="(settings)"
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
                      <Stack.Screen
                        name="Services/NearbyAll"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="Services/RecommendedAll"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="chat/UserChatScreen"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen name="+not-found" />
                    </Stack>
                  </FavoritesProvider>
                </AuthProvider>
              </KeyboardProvider>
            </BottomSheetModalProvider>
          </ThemeProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
