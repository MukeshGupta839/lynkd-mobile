import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type InviteStatus = "pending" | "accepted" | "rejected";
type AgencyInvite = {
  request_id: string;
  creator_id: string;
  request_message: string;
  agency_name: string;
  agency_id: string;
  agency_image?: string;
  status: InviteStatus;
  created_at: string;
};

const { width } = Dimensions.get("window");
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const makeMockInvites = (count = 6): AgencyInvite[] =>
  Array.from({ length: count }, (_, i) => ({
    request_id: `req_${i + 1}`,
    creator_id: `creator_${i + 10}`,
    agency_id: `agency_${i + 1}`,
    agency_name: [
      "Aether Media",
      "Nova Labs",
      "BluePeak",
      "Fable",
      "Lumio",
      "Onyx",
    ][i % 6],
    agency_image: `https://i.pravatar.cc/100?u=agency_${i + 1}`,
    request_message:
      i % 2 === 0
        ? "We love your content and would like to invite you to collaborate."
        : "Let’s work together on upcoming campaigns.",
    status: i % 3 === 0 ? "accepted" : "pending",
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
  }));

const AgencyInvites: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [invites, setInvites] = useState<AgencyInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 3200,
          useNativeDriver: false,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 3600,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  const glowShadowColor = glow.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      "rgba(16,24,39,0.18)",
      "rgba(99,102,241,0.25)",
      "rgba(16,24,39,0.18)",
    ],
  });
  const glowBorderColor = glow.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["#0F27BD", "#ffc202", "#3d576c"],
  });

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setInvites(makeMockInvites(8));
      setLoading(false);
    }, 650);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return invites;
    return invites.filter(
      (i) =>
        i.agency_name.toLowerCase().includes(q) ||
        i.request_message.toLowerCase().includes(q)
    );
  }, [searchQuery, invites]);

  const acceptRequest = (request_id: string) => {
    setInvites((curr) =>
      curr.map((r) =>
        r.request_id === request_id ? { ...r, status: "accepted" } : r
      )
    );
  };

  const renderItem = ({ item }: { item: AgencyInvite }) => {
    const dateStr = new Date(item.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return (
      <View className="mb-2 flex-row items-center rounded-xl bg-white p-4">
        <Image
          source={{
            uri: item.agency_image || "https://via.placeholder.com/60",
          }}
          className="mr-4 h-12 w-12 rounded-full"
        />
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-zinc-900">
              {item.agency_name}
            </Text>
            <View
              className={[
                "rounded-full px-2 py-1",
                item.status === "pending"
                  ? "bg-amber-50"
                  : item.status === "accepted"
                    ? "bg-emerald-50"
                    : "bg-rose-50",
              ].join(" ")}
            />
          </View>
          <Text className="mt-1 text-[13px] text-zinc-700">
            {item.request_message}
          </Text>
          <Text className="mt-1 text-[11px] text-zinc-400">{dateStr}</Text>
        </View>

        {item.status === "pending" && (
          <TouchableOpacity
            onPress={() => acceptRequest(item.request_id)}
            className="ml-3"
            accessibilityRole="button"
            accessibilityLabel="Accept request"
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={28}
              color="#22c55e"
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View
      className="flex-1 bg-zinc-100"
      style={{
        paddingTop: insets.top,
      }}
    >
      {/* Use the same header component as Favorites */}
      {/* <ScreenHeaderBack title="Agency Invites" onBack={() => router.back()} /> */}

      {/* Search row (no extra top margins; matches Favorites spacing) */}
      <View className="flex-row flex pr-3 items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="chevron-left" size={30} color="#101112" />
        </Pressable>
        <Animated.View
          style={{
            flex: 1,
            height: 40,
            borderWidth: 2,
            borderRadius: 10,
            paddingHorizontal: 12,
            backgroundColor: "white",
            flexDirection: "row",
            alignItems: "center",
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 10,
            elevation: 5,
            borderColor: glowBorderColor as any,
            shadowColor: glowShadowColor as any,
            shadowOpacity: 0.8,
          }}
        >
          <Ionicons
            name="search"
            size={18}
            color="#666"
            style={{ marginRight: 8 }}
          />
          <AnimatedTextInput
            placeholder="Search Agencies"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            className="flex-1 text-[13px] text-zinc-800"
          />
        </Animated.View>
      </View>

      {/* List */}
      {loading ? (
        <View className="mt-6 items-center">
          <ActivityIndicator />
        </View>
      ) : filtered.length === 0 ? (
        <View className="mt-10 items-center px-6">
          <Text className="text-center text-[16px] text-zinc-800">
            No Requests From Agencies. Check back later!
          </Text>
        </View>
      ) : (
        <FlatList
          className="mt-3 px-3"
          data={filtered}
          keyExtractor={(i) => i.request_id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default AgencyInvites;
