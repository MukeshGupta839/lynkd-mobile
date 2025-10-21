// components/StoreProfileScreen.tsx

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  PixelRatio,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Icons
import Feather from "@expo/vector-icons/Feather";
import Foundation from "@expo/vector-icons/Foundation";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Octicons from "@expo/vector-icons/Octicons";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";

// Optional: reuse your existing Notes renderer
import TextPost from "./TextPost";

const { width } = Dimensions.get("window");

// Match container padding (px-3) = 12 on each side
const H_PADDING = 12;
// Desired gap between tiles
const GAP = 2;
// Helper to keep sizes on device pixel grid
const toDP = (n: number) => PixelRatio.roundToNearestPixel(n);

interface StoreDetails {
  id: number;
  slug?: string;
  name: string;
  handle: string;
  bio?: string;
  logo?: string;
  banner?: string;
  verified?: boolean;
  postsCount: number;
  reelsCount: number;
  followersCount: number;
  followingCount: number;
  is_owner: boolean;
}

interface StoreProfileProps {
  storeId?: number;
  slug?: string;
  fetchStoreDetails?: (storeId: number, slug?: string) => Promise<StoreDetails>;
  fetchStorePosts?: (storeId: number) => Promise<any[]>;
  fetchStoreReels?: (storeId: number) => Promise<any[]>;
  fetchStoreProducts?: (storeId: number) => Promise<any[]>;
  onFollow?: (storeId: number) => Promise<void>;
  onUnfollow?: (storeId: number) => Promise<void>;
}

export default function StoreProfileScreen({
  storeId: propStoreId,
  slug: propSlug,
  fetchStoreDetails,
  fetchStorePosts,
  fetchStoreReels,
  fetchStoreProducts,
  onFollow,
  onUnfollow,
}: StoreProfileProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [store, setStore] = useState<StoreDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Photos" | "Videos" | "Notes">(
    "Photos"
  );
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [followState, setFollowState] = useState<"" | "followed">("");

  const storeID =
    propStoreId ||
    (params.store
      ? Number(Array.isArray(params.store) ? params.store[0] : params.store)
      : 1);

  const kFormatter = (num: number): string => {
    if (Math.abs(num) > 999_999_999)
      return (Math.abs(num) / 1_000_000_000).toFixed(1) + "B";
    if (Math.abs(num) > 999_999)
      return (Math.abs(num) / 1_000_000).toFixed(1) + "M";
    if (Math.abs(num) > 999) return (Math.abs(num) / 1_000).toFixed(1) + "K";
    return String(Math.abs(num));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (fetchStoreDetails) {
          const details = await fetchStoreDetails(storeID, propSlug as string);
          setStore(details);
        }
        if (fetchStorePosts) setPosts(await fetchStorePosts(storeID));
        if (fetchStoreReels) setReels(await fetchStoreReels(storeID));
        if (fetchStoreProducts) setProducts(await fetchStoreProducts(storeID));
      } catch (e) {
        console.error("Store profile load error", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [
    storeID,
    propSlug,
    fetchStoreDetails,
    fetchStorePosts,
    fetchStoreReels,
    fetchStoreProducts,
  ]);

  const toggleFollow = async () => {
    try {
      if (followState === "followed") {
        if (onUnfollow) await onUnfollow(storeID);
        setFollowState("");
      } else {
        if (onFollow) await onFollow(storeID);
        setFollowState("followed");
      }
    } catch (e) {
      console.error("toggleFollow error", e);
    }
  };

  const logoUri = useMemo(() => {
    const u = store?.logo || "";
    const isSvg = /\.svg($|\?)/i.test(u);
    return isSvg
      ? "https://fabrikbrands.com/wp-content/uploads/Apple-Logo-History-1-1155x770.png"
      : u || "https://dummyimage.com/200x200/ffffff/000000.png&text=Logo";
  }, [store?.logo]);

  // ---------- Grids (EVEN EDGES) ----------
  const renderPhotosGrid = () => {
    const images = posts.filter((p) => p.text_post === false && p.media_url);
    if (images.length === 0)
      return (
        <View className="items-center justify-center py-12 ">
          <Feather name="image" size={48} color="#ccc" />
          <Text className="text-sm text-gray-500 mt-4 text-center">
            No photos yet. Photos shared will appear here.
          </Text>
        </View>
      );

    // inner width inside px-3 padding
    const innerWidth = width - H_PADDING * 2;

    // base size per tile (rounded to device pixels)
    const baseSize = toDP((innerWidth - GAP * 2) / 3);

    // rows of 3
    const rows: any[][] = [];
    for (let i = 0; i < images.length; i += 3)
      rows.push(images.slice(i, i + 3));

    return (
      <View>
        {rows.map((row, idx) => (
          <View
            key={idx}
            style={{
              width: innerWidth, // lock exact row width
              flexDirection: "row",
              marginBottom: 1,
            }}>
            {row.map((img, i) => {
              const isLastOfThree = row.length === 3 && i === 2;
              const computedW = isLastOfThree
                ? // let last tile absorb fractional remainder
                  toDP(innerWidth - (baseSize * 2 + GAP * 2))
                : baseSize;

              return (
                <TouchableOpacity
                  key={img.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    width: computedW,
                    height: baseSize,
                    marginRight: i < row.length - 1 ? GAP : 0,
                  }}>
                  <Image
                    source={{ uri: img.media_url }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              );
            })}

            {/* Fillers to keep alignment if row < 3 */}
            {row.length < 3 &&
              new Array(3 - row.length).fill(0).map((_, fillerIdx) => (
                <View
                  key={`f-${fillerIdx}`}
                  style={{
                    width: fillerIdx < 3 - row.length - 1 ? baseSize : baseSize,
                    height: baseSize,
                    marginLeft: GAP,
                    opacity: 0,
                  }}
                />
              ))}
          </View>
        ))}
      </View>
    );
  };

  const renderVideosGrid = () => {
    if (reels.length === 0)
      return (
        <View className="items-center justify-center py-12">
          <Feather name="video" size={48} color="#ccc" />
          <Text className="text-sm text-gray-500 mt-4 text-center">
            No videos yet. Videos shared will appear here.
          </Text>
        </View>
      );

    const innerWidth = width - H_PADDING * 2;
    const baseW = toDP((innerWidth - GAP * 2) / 3);
    const videoH = baseW * 1.5;

    const rows: any[][] = [];
    for (let i = 0; i < reels.length; i += 3) rows.push(reels.slice(i, i + 3));

    return (
      <View>
        {rows.map((row, idx) => (
          <View
            key={idx}
            style={{
              width: innerWidth,
              flexDirection: "row",
              marginBottom: 1,
            }}>
            {row.map((v, i) => {
              const isLastOfThree = row.length === 3 && i === 2;
              const computedW = isLastOfThree
                ? toDP(innerWidth - (baseW * 2 + GAP * 2))
                : baseW;

              return (
                <TouchableOpacity
                  key={v.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    width: computedW,
                    height: videoH,
                    marginRight: i < row.length - 1 ? GAP : 0,
                  }}>
                  <Image
                    source={{ uri: v.thumbnail_url }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-2 left-2 flex-row items-center bg-black/50 px-2 py-1 rounded-xl">
                    <Feather name="play" size={16} color="#fff" />
                    <Text className="text-white text-xs ml-1">
                      {kFormatter(
                        v?.reels_views_aggregate?.aggregate?.count || 0
                      )}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {row.length < 3 &&
              new Array(3 - row.length).fill(0).map((_, fillerIdx) => (
                <View
                  key={`fv-${fillerIdx}`}
                  style={{
                    width: baseW,
                    height: videoH,
                    marginLeft: GAP,
                    opacity: 0,
                  }}
                />
              ))}
          </View>
        ))}
      </View>
    );
  };

  const renderNotes = () => {
    const notes = posts.filter((p) => p.text_post === true);
    if (notes.length === 0)
      return (
        <View className="items-center justify-center py-12">
          <Foundation name="text-color" size={48} color="#ccc" />
          <Text className="text-sm text-gray-500 mt-4 text-center">
            No notes yet. Notes shared will appear here.
          </Text>
        </View>
      );
    return (
      <View className="gap-2">
        {notes.map((item) => (
          <TextPost
            key={item.id}
            item={item}
            onPress={() => {}}
            likedPosts={[]}
            likedPostIDs={[]}
            handleShare={() => {}}
            toggleLike={() => {}}
            commentBox={() => {}}
            toggleFollow={() => {}}
            followedUsers={[]}
            setFocusedPostID={() => {}}
            hideActions={true}
          />
        ))}
      </View>
    );
  };

  const renderProducts = () => {
    if (products.length === 0)
      return (
        <View className="items-center justify-center py-12">
          <SimpleLineIcons name="handbag" size={48} color="#ccc" />
          <Text className="text-sm text-gray-500 mt-4 text-center">
            No products yet.
          </Text>
        </View>
      );

    return (
      <View className="flex-row flex-wrap justify-between">
        {products.map((p) => (
          <TouchableOpacity
            key={p.id}
            className="mb-4 rounded-xl overflow-hidden bg-gray-50 border border-gray-200"
            style={{ width: (width - 40) / 2 }}>
            <Image
              source={{ uri: p.main_image }}
              className="w-full h-40"
              resizeMode="cover"
            />
            <View className="p-2">
              <Text className="text-sm font-medium text-gray-900">
                {p.name?.length > 18 ? p.name.slice(0, 18) + "…" : p.name}
              </Text>
              <Text className="text-sm font-semibold text-gray-900 mt-1">
                ₹{p.sale_price}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading)
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );

  if (!store)
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-base text-gray-600">
          Failed to load store profile
        </Text>
      </View>
    );

  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}>
        {/* Banner */}
        <View className="relative h-52">
          <Image
            source={{
              uri:
                store.banner ||
                "https://img.freepik.com/free-vector/gradient-trendy-background_23-2150417179.jpg",
            }}
            className="w-full h-full"
            resizeMode="cover"
          />

          {/* Top-left back */}
          <View
            className="absolute inset-0 flex-row justify-between px-3"
            style={{ paddingTop: insets.top - 10 }}>
            <TouchableOpacity
              className="w-9 h-9 rounded-full bg-black/30 justify-center items-center"
              onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              className="w-9 h-9 rounded-full bg-black/30 justify-center items-center"
              onPress={() => router.push("/(settings)")}>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Card */}
        <View className="bg-gray-100 px-3 pt-4 -mt-4">
          {/* Avatar + name */}
          <View className="flex-row items-center -mt-10">
            <View className="rounded-full border-4 border-white bg-white overflow-hidden">
              <Image
                source={{ uri: logoUri }}
                className="w-20 h-20 rounded-full"
                resizeMode="cover"
              />
            </View>

            <View className="ml-3 mt-2 flex-1">
              <View className="flex-row items-center flex-wrap">
                <Text className="text-lg font-bold text-gray-900 mr-1">
                  {store.name}
                </Text>
                {store.verified && (
                  <Octicons name="verified" size={16} color="#1a1a1a" />
                )}
              </View>
              <Text className="text-base text-gray-600">{store.handle}</Text>
            </View>
          </View>

          {/* Bio */}
          {!!store.bio && (
            <View className="py-2">
              <Text className="text-base text-gray-700 leading-5">
                {store.bio}
              </Text>
            </View>
          )}

          {/* Stats */}
          <View className="flex-row justify-around py-1 mb-1">
            <TouchableOpacity className="items-center" disabled>
              <Text className="text-sm font-bold text-gray-900">
                {kFormatter((store.postsCount || 0) + (store.reelsCount || 0))}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center" disabled>
              <Text className="text-sm font-bold text-gray-900">
                {kFormatter(store.followersCount || 0)}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center" disabled>
              <Text className="text-sm font-bold text-gray-900">
                {kFormatter(store.followingCount || 0)}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">Following</Text>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View className="flex-row justify-between mb-6">
            {store.is_owner ? (
              <>
                <TouchableOpacity
                  className="flex-1 h-10 rounded-full justify-center items-center bg-white mr-2"
                  onPress={() => router.push("/(profiles)/editProfile")}>
                  <Text className="text-sm font-semibold text-gray-900">
                    Edit Profile
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 h-10 rounded-full justify-center items-center bg-gray-900 ml-2"
                  onPress={() => router.push("/(profiles)/InviteHome")}>
                  <Text className="text-sm font-semibold text-white">
                    Invite
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {followState !== "followed" ? (
                  <TouchableOpacity
                    className="flex-1 h-10 rounded-full justify-center items-center bg-gray-900"
                    onPress={toggleFollow}>
                    <Text className="text-sm font-semibold text-white">
                      Follow
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      className="flex-1 h-10 rounded-full justify-center items-center bg-white mr-2"
                      onPress={toggleFollow}>
                      <Text className="text-sm font-semibold text-gray-900">
                        Following
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 h-10 rounded-full justify-center items-center bg-gray-900 ml-2"
                      onPress={() => {
                        router.push({
                          pathname: "/Store/viewShop",
                          params: {
                            store: store.id,
                            slug: store.slug || "",
                          },
                        });
                      }}>
                      <Text className="text-sm font-semibold text-white">
                        View Shop
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>

          {/* Tabs */}
          <View className="flex-row justify-between mb-4">
            {(["Photos", "Videos", "Notes"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                className={`w-12 h-12 rounded-full justify-center items-center ${
                  activeTab === tab ? "bg-gray-900" : "bg-white"
                }`}
                onPress={() => setActiveTab(tab)}>
                {tab === "Photos" && (
                  <Foundation
                    name="photo"
                    size={18}
                    color={activeTab === tab ? "#fff" : "#666"}
                  />
                )}
                {tab === "Videos" && (
                  <Foundation
                    name="play-video"
                    size={18}
                    color={activeTab === tab ? "#fff" : "#666"}
                  />
                )}
                {tab === "Notes" && (
                  <Foundation
                    name="text-color"
                    size={18}
                    color={activeTab === tab ? "#fff" : "#666"}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <View className="mb-6 ">
            {activeTab === "Photos" && renderPhotosGrid()}
            {activeTab === "Videos" && renderVideosGrid()}
            {activeTab === "Notes" && renderNotes()}
          </View>

          {posts.length === 0 && (
            <View className="items-center justify-center py-12">
              <Feather name="image" size={48} color="#ccc" />
              <Text className="text-sm text-gray-500 text-center mt-4">
                No posts yet. Content shared will appear here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
