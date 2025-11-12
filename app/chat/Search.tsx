import SearchBar from "@/components/Searchbar";
import { DEFAULT_AVATAR } from "@/constants/chat";
import { AuthContext } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ---- Endpoint (followers/following list for starting chats) ---- */
const CHAT_LIST_FOR_USER = (id: string | number) =>
  `/api/messages/chat-list/${id}`;

type Person = {
  id: string | number;
  username: string;
  profile_picture?: string;
};

const PersonRow = memo(function PersonRow({
  person,
  onMessage,
}: {
  person: Person;
  onMessage: (u: Person) => void;
}) {
  const displayName =
    (person.username ?? "user").charAt(0).toUpperCase() +
    (person.username ?? "user").slice(1);

  return (
    <View className="flex-row items-center px-3 py-3 border-b border-gray-100">
      <Image
        source={{ uri: person.profile_picture || DEFAULT_AVATAR }}
        className="w-12 h-12 rounded-full"
      />

      <View className="flex-1 ml-3">
        <Text className="text-base font-medium text-black">{displayName}</Text>
        <Text className="text-xs text-gray-500" numberOfLines={1}>
          @{person.username}
        </Text>
      </View>

      <Pressable
        onPress={() => onMessage(person)}
        className="px-3 py-1.5 rounded-full"
        style={{ backgroundColor: "#000" }}
        accessibilityLabel={`Message ${displayName}`}>
        <Text className="text-white text-sm font-semibold">Message</Text>
      </Pressable>
    </View>
  );
});

export default function SearchPeople() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const auth = useContext(AuthContext);
  const me = auth?.user;
  const ME_ID = (me?.id as string | number | undefined) ?? "me";
  const ME_USERNAME = me?.username ?? "you";
  const ME_AVATAR = (me as any)?.profilePicture ?? DEFAULT_AVATAR;

  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<Person[]>([]);
  const [q, setQ] = useState("");

  const loadList = useCallback(async () => {
    if (!ME_ID) return;
    setLoading(true);
    try {
      const { apiCall } = await import("@/lib/api/apiService");
      const res = await apiCall(CHAT_LIST_FOR_USER(ME_ID), "GET");
      const raw = (res?.data ?? []) as any[];

      const mapped: Person[] = raw
        .map((r) => ({
          id: r.id ?? r.user_id,
          username: r.username ?? r.user_name ?? "user",
          profile_picture: r.profile_picture ?? r.user_image ?? DEFAULT_AVATAR,
        }))
        .filter((p) => p.id != null);

      const byId = new Map<string | number, Person>();
      mapped.forEach((p) => byId.set(p.id, p));
      setPeople(Array.from(byId.values()));
    } catch (e) {
      console.error("Search list fetch failed:", e);
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, [ME_ID]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return people;
    return people.filter((p) =>
      (p.username ?? "").toLowerCase().includes(term)
    );
  }, [people, q]);

  const startMessage = useCallback(
    (u: Person) => {
      router.push({
        pathname: "/chat/UserChatScreen",
        params: {
          userId: u.id,
          username: u.username,
          profilePicture: u.profile_picture ?? DEFAULT_AVATAR,
          loggedUserId: ME_ID,
          loggedUsername: ME_USERNAME,
          loggedAvatar: ME_AVATAR,
        },
      });
    },
    [router, ME_ID, ME_USERNAME, ME_AVATAR]
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: insets.top }}>
      {/* Header with back arrow */}
      <View className="flex-row  pt-1 items-center px-2 pb-2">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          className="">
          <Ionicons name="chevron-back" size={24} color="#000" />
        </Pressable>
        <Text className="text-lg font-semibold  ml-44">Search</Text>
      </View>

      {/* Top search bar */}
      <View className="px-3 py-2">
        <SearchBar
          value={q}
          onChangeText={setQ}
          placeholder="Search followers & following"
        />
      </View>

      {/* Followers/Following list (filtered) */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2 text-gray-500">Loading people...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PersonRow person={item} onMessage={startMessage} />
          )}
          ListEmptyComponent={
            <View className="mt-10 items-center">
              <Text className="text-gray-500">
                {q ? "No matches found." : "No followers/following found."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
