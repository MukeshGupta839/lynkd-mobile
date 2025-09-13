// AddNewAddress.tsx
// React Native (TypeScript) + nativewind tailwind classes
// Uses navigator.geolocation (no expo-location).
// Uses only flex / grid layouts via tailwind className.

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  PermissionsAndroid,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  onBack?: () => void;
  onLocationDetected?: (lat: number, lon: number) => void;
  onSearchAnother?: () => void;
};

export default function AddNewAddress({
  onBack,
  onLocationDetected,
  onSearchAnother,
}: Props) {
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  async function requestAndroidPermission(): Promise<boolean> {
    if (Platform.OS !== "android") return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message:
            "This app needs access to your location to auto-detect your address.",
          buttonPositive: "Allow",
          buttonNegative: "Deny",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
      return false;
    }
  }

  const handleEnableLocation = async () => {
    // Ask Android permission at runtime (iOS prompts from system automatically).
    const ok = await requestAndroidPermission();
    if (!ok) {
      Alert.alert("Permission required", "Location permission was denied.");
      return;
    }

    if (!("geolocation" in navigator)) {
      // navigator.geolocation is available in most RN environments; show helpful message if not.
      Alert.alert(
        "Not available",
        "Geolocation is not available on this device/config."
      );
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });
        onLocationDetected?.(latitude, longitude);
        // show brief feedback
        Alert.alert(
          "Location detected",
          `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        );
      },
      (err) => {
        setLoading(false);
        Alert.alert("Failed to get location", err?.message ?? "Unknown error");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 w-full max-w-md mx-auto">
        {/* Header */}
        <View className="flex-row items-center  py-3">
          <TouchableOpacity
            onPress={() => onBack?.()}
            className="w-9 h-9 rounded-full items-center justify-center"
            accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={20} color="#111827" />
          </TouchableOpacity>
          <Text className="text-base font-medium ml-2">Add New Address</Text>
        </View>

        {/* Search bar */}
        <View className="">
          <View className="flex-row items-center bg-white rounded-lg border border-gray-200 px-3 py-2 shadow-sm">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by area"
              placeholderTextColor="#6B7280"
              className="flex-1 text-sm"
              returnKeyType="search"
              accessible
              accessibilityLabel="Search by area"
            />
            <TouchableOpacity
              onPress={() => {
                /* optional search action */
              }}
              className="p-1">
              <Ionicons name="search" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Illustration container */}
        <View className=" mt-6">
          <View className="bg-white rounded-md p-3 items-center justify-center">
            {/* Blue framed area */}
            <View
              className="w-full overflow-hidden rounded-sm border-4 border-blue-400 bg-gray-100"
              style={{ aspectRatio: 4 / 3 }}>
              {/* Use your local asset here */}
            </View>
          </View>
        </View>

        {/* Spacer so buttons visually sit at bottom */}
        <View className="flex-1" />

        {/* Bottom actions — using grid layout (single column) */}
        <View className=" ">
          <View className="grid grid-cols-1 gap-3">
            <TouchableOpacity
              onPress={handleEnableLocation}
              className="w-full py-3 rounded-xl items-center justify-center bg-[#26FF91]"
              accessibilityLabel="Enable Location"
              disabled={loading}>
              <Text className="text-black font-semibold">
                {loading ? "Detecting..." : "Enable Location"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onSearchAnother?.()}
              className="w-full py-3 rounded-xl border border-emerald-300 bg-white items-center justify-center"
              accessibilityLabel="Search Another Location">
              <Text className="text-sm font-medium">
                Search Another Location
              </Text>
            </TouchableOpacity>

            {/* Optional small hint showing detected coords */}
            {coords ? (
              <View className="mt-2 px-3 py-2 rounded-md bg-white border border-gray-200">
                <Text className="text-xs text-gray-600">
                  Detected: {coords.latitude.toFixed(5)},{" "}
                  {coords.longitude.toFixed(5)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
