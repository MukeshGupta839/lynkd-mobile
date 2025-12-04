// app/(boost)/locations.tsx
import SearchBar from "@/components/Searchbar";
import { useBoostStore } from "@/stores/useBoostStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ESTIMATED_MIN = "410.3M";
const ESTIMATED_MAX = "482.6M";

const INDIA_LOCATIONS = [
  { id: "india", name: "India" },
  { id: "delhi", name: "Delhi, India" },
  { id: "mumbai", name: "Mumbai, Maharashtra, India" },
  { id: "bengaluru", name: "Bengaluru, Karnataka, India" },
  { id: "chennai", name: "Chennai, Tamil Nadu, India" },
  { id: "kolkata", name: "Kolkata, West Bengal, India" },
  { id: "hyderabad", name: "Hyderabad, Telangana, India" },
  { id: "pune", name: "Pune, Maharashtra, India" },
  { id: "ahmedabad", name: "Ahmedabad, Gujarat, India" },
  { id: "jaipur", name: "Jaipur, Rajasthan, India" },
  { id: "surat", name: "Surat, Gujarat, India" },
  { id: "lucknow", name: "Lucknow, Uttar Pradesh, India" },
  { id: "kanpur", name: "Kanpur, Uttar Pradesh, India" },
  { id: "nagpur", name: "Nagpur, Maharashtra, India" },
  { id: "indore", name: "Indore, Madhya Pradesh, India" },
  { id: "thane", name: "Thane, Maharashtra, India" },
  { id: "vadodara", name: "Vadodara, Gujarat, India" },
  { id: "coimbatore", name: "Coimbatore, Tamil Nadu, India" },
  { id: "ludhiana", name: "Ludhiana, Punjab, India" },
  { id: "agra", name: "Agra, Uttar Pradesh, India" },
];

const DEFAULT_LOCATION = "India";

const LocationsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { audience, setAudience } = useBoostStore();

  const params = useLocalSearchParams<{ location?: string }>();

  const initialLocationName =
    typeof params.location === "string"
      ? params.location
      : audience.location || DEFAULT_LOCATION;

  const [selectedLocation, setSelectedLocation] = useState(initialLocationName);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"regional" | "local">("regional");

  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(5);

  // awesome-slider shared values
  const min = useSharedValue(1);
  const max = useSharedValue(80);
  const progress = useSharedValue(radiusKm);

  // when search empty -> show ALL locations
  const filteredLocations = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return INDIA_LOCATIONS;
    }

    return INDIA_LOCATIONS.filter((loc) => loc.name.toLowerCase().includes(q));
  }, [search]);

  const handleDone = () => {
    const finalLocation = selectedLocation || DEFAULT_LOCATION;

    // update global audience location in store
    setAudience({ location: finalLocation });

    // ✅ just go back to AudienceDetails (previous screen)
    router.back();
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header with safe-area padding */}
      <View style={{ paddingTop: insets.top - 10 }}>
        <View className="flex-row items-center justify-between px-3 border-b border-gray-200">
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={28} />
          </Pressable>

          <Text className="text-xl font-semibold text-gray-900">Locations</Text>

          <Pressable onPress={handleDone} className="p-1">
            <Ionicons name="checkmark" size={26} />
          </Pressable>
        </View>
      </View>

      {/* Estimated audience size */}
      <View className="mt-6 px-4 items-center">
        <Text className="text-3xl font-semibold text-gray-900">
          {tab === "regional" ? `${ESTIMATED_MIN} - ${ESTIMATED_MAX}` : "N/A"}
        </Text>
        <Text className="mt-1 text-sm text-gray-500">
          Estimated audience size
        </Text>
      </View>

      {/* Tabs */}
      <View className="mt-6 flex-row border-b border-gray-200">
        {["regional", "local"].map((t) => (
          <Pressable
            key={t}
            className={`flex-1 items-center pb-2 ${
              tab === t ? "border-b-2 border-black" : ""
            }`}
            onPress={() => setTab(t as "regional" | "local")}>
            <Text
              className={`text-base ${
                tab === t ? "font-semibold text-gray-900" : "text-gray-500"
              }`}>
              {t === "regional" ? "Regional" : "Local"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content area */}
      <View className="flex-1 px-3 pb-8">
        {tab === "regional" ? (
          // 👉 Only list scrolls, header text is fixed
          <View className="flex-1">
            {/* Search (fixed) */}
            <View className="mt-5">
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder="Search locations"
                borderRadius={20}
                className="border border-gray-300"
              />
            </View>

            {/* Info text (fixed) */}
            <Text className="mt-4 text-sm text-gray-500">
              Adding a broad range of countries, regions and cities increases
              the number of people who can see your ad.
            </Text>

            {/* Scrollable list only */}
            <ScrollView
              className="mt-6 flex-1"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {filteredLocations.length === 0 ? (
                <Text className="text-sm text-gray-500">
                  No locations found.
                </Text>
              ) : (
                filteredLocations.map((loc) => {
                  const selected = loc.name === selectedLocation;
                  return (
                    <Pressable
                      key={loc.id}
                      onPress={() => {
                        setSelectedLocation(loc.name);
                      }}
                      className="py-3 flex-row items-center justify-between">
                      <Text className="text-base text-gray-900">
                        {loc.name}
                      </Text>
                      <Ionicons
                        name={selected ? "checkmark-circle" : "ellipse-outline"}
                        size={22}
                        color={selected ? "#000000" : "#D1D5DB"}
                      />
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        ) : (
          // Local tab – whole content can scroll
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Dummy map */}
            <View className="mt-4 h-64 rounded-3xl bg-sky-400 items-center justify-center">
              <View className="w-52 h-52 rounded-full bg-sky-500 opacity-90 items-center justify-center">
                <Ionicons name="location-sharp" size={40} color="#EF4444" />
              </View>
            </View>

            {/* CURRENT LOCATION */}
            <View className="mt-6 flex-row items-center justify-between">
              <Text
                className={`text-base ${
                  useCurrentLocation
                    ? "font-bold text-black"
                    : "font-normal text-gray-900"
                }`}>
                Your current location
              </Text>
              <Switch
                value={useCurrentLocation}
                onValueChange={setUseCurrentLocation}
                trackColor={{ false: "#d1d5db", true: "#000000" }}
                thumbColor={"#ffffff"}
                ios_backgroundColor="#d1d5db"
              />
            </View>

            {/* Address -> hidden when toggle ON */}
            {!useCurrentLocation && (
              <Pressable className="mt-6 flex-row items-center justify-between py-3 border-b border-gray-200">
                <Text className="text-base text-gray-900">Address</Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </Pressable>
            )}

            {/* Radius slider – black bubble, white text, integer value */}
            <View className="mt-6">
              <Text className="text-base text-gray-900">Radius</Text>
              <Text className="mt-2 text-sm text-gray-500">{radiusKm} km</Text>

              <View className="mt-4">
                <Slider
                  progress={progress}
                  minimumValue={min}
                  maximumValue={max}
                  step={1}
                  // theme controls track + bubble background
                  theme={{
                    maximumTrackTintColor: "#E5E7EB", // light gray
                    minimumTrackTintColor: "#000000", // black active track
                    cacheTrackTintColor: "#111827", // dark gray cache
                    disableMinTrackTintColor: "#999999",
                    bubbleBackgroundColor: "#000000", // black bubble card
                    heartbeatColor: "#000000",
                  }}
                  // format bubble text: integers only (no 23.52)
                  bubble={(value) => `${Math.round(value)}`}
                  // bubble text style: white text
                  bubbleTextStyle={{ color: "#FFFFFF", fontWeight: "600" }}
                  onValueChange={(value) => {
                    const rounded = Math.round(value as number);
                    setRadiusKm(rounded);
                    progress.value = rounded;
                  }}
                />
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default LocationsScreen;
