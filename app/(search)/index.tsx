import SearchPostsWithTags from "@/components/SearchPostsWithTags";
import { Ionicons, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { debounce } from "lodash";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiCall } from "../../lib/api/apiService";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const { width: PAGE_WIDTH } = Dimensions.get("window");

type TabKey = "people" | "brands" | "products" | "hashtags";

const TABS: {
  key: TabKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  { key: "people", label: "People", icon: "person" },
  { key: "brands", label: "Brands", icon: "storefront" },
  { key: "products", label: "Products", icon: "pricetag" },
  { key: "hashtags", label: "Hashtags", icon: "pricetags" },
];

/** -------------------------------
 * HELPERS
 * ------------------------------- */
const safe = (v?: string | null) => (v ?? "").trim();

// Helper function to replace null values
const replaceNull = (value: any) => (value === null ? "" : value);

/** -------------------------------
 * COMPONENT
 * ------------------------------- */
const SearchScreen = () => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("people");
  const flatListRef = useRef<FlatList<{ key: TabKey }> | null>(null);
  const glow = useSharedValue(0);

  // API-fetched results state (replaces dummy data filtering)
  const [apiUsersResults, setApiUsersResults] = useState<any[]>([]);
  const [apiBrandsResults, setApiBrandsResults] = useState<any[]>([]);
  const [apiProductsResults, setApiProductsResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useApiData, setUseApiData] = useState(false); // Toggle between dummy and API data

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      false
    );
  }, [glow]);

  // API fetch functions
  const fetchUsersbySearch = useCallback(async (query: string) => {
    try {
      const response = await apiCall(
        `/api/search/users?search=${query}`,
        "GET"
      );
      const data = response.data;

      const users = data.map((user: any) => ({
        id: user.id,
        first_name: replaceNull(user.first_name),
        last_name: replaceNull(user.last_name),
        username: user.username,
        profile_picture: user.profile_picture,
        is_creator: user.is_creator,
      }));

      // Sort by username priority
      users.sort((a: any, b: any) => {
        const q = query.toLowerCase();
        const aUsername = a.username.toLowerCase();
        const bUsername = b.username.toLowerCase();

        if (aUsername === q) return -1;
        if (bUsername === q) return 1;
        if (aUsername.startsWith(q) && !bUsername.startsWith(q)) return -1;
        if (bUsername.startsWith(q) && !aUsername.startsWith(q)) return 1;
        if (aUsername.includes(q) && !bUsername.includes(q)) return -1;
        if (bUsername.includes(q) && !aUsername.includes(q)) return 1;
        return 0;
      });
      users.reverse();
      setApiUsersResults(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      setApiUsersResults([]);
    }
  }, []);

  const fetchBrandsbySearch = useCallback(async (query: string) => {
    try {
      const response = await apiCall(
        `/api/search/brands?search=${query}`,
        "GET"
      );
      const data = response.data;

      const brands = data.map((brand: any) => ({
        id: brand.id,
        brand_name: brand.brand_name,
        brandLogoURL: brand.brandLogoURL,
      }));

      setApiBrandsResults(brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      setApiBrandsResults([]);
    }
  }, []);

  const fetchProductsbySearch = useCallback(async (query: string) => {
    try {
      const response = await apiCall(
        `/api/search/products?search=${query}`,
        "GET"
      );
      const data = response.data;

      console.log("Fetched products:", data);

      const products = data.map((product: any) => ({
        id: product.id,
        name: product.name,
        regular_price: product.regular_price,
        sale_price: product.sale_price,
        main_image: product.main_image,
        brand: {
          id: product.brand.id,
          brand_name: product.brand.brand_name,
          brandLogoURL: product.brand.brandLogoURL,
        },
      }));

      setApiProductsResults(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      setApiProductsResults([]);
    }
  }, []);

  // Debounced search function
  const debouncedSearchRef = useRef(
    debounce(
      async (
        query: string,
        tab: TabKey,
        fetchUsers: (q: string) => Promise<void>,
        fetchBrands: (q: string) => Promise<void>,
        fetchProducts: (q: string) => Promise<void>,
        setLoading: (loading: boolean) => void,
        setUseApi: (use: boolean) => void,
        clearResults: () => void
      ) => {
        setLoading(true);
        try {
          // If query is empty, fetch with default "a" to get all results
          const searchTerm = query.trim() || "a";

          if (tab === "people") {
            await fetchUsers(searchTerm);
          } else if (tab === "brands") {
            await fetchBrands(searchTerm);
          } else if (tab === "products") {
            await fetchProducts(searchTerm);
          }
          setUseApi(true);
        } finally {
          setLoading(false);
        }
      },
      500
    )
  );

  const debouncedSearch = useCallback(
    (query: string, tab: TabKey) => {
      debouncedSearchRef.current(
        query,
        tab,
        fetchUsersbySearch,
        fetchBrandsbySearch,
        fetchProductsbySearch,
        setIsLoading,
        setUseApiData,
        () => {
          setApiUsersResults([]);
          setApiBrandsResults([]);
          setApiProductsResults([]);
        }
      );
    },
    [fetchUsersbySearch, fetchBrandsbySearch, fetchProductsbySearch]
  );

  // Fetch default results for all tabs on mount
  useEffect(() => {
    const fetchDefaultResults = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchUsersbySearch("a"),
          fetchBrandsbySearch("a"),
          fetchProductsbySearch("a"),
        ]);
        setUseApiData(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDefaultResults();
  }, [fetchUsersbySearch, fetchBrandsbySearch, fetchProductsbySearch]);

  // Trigger search when query or tab changes
  useEffect(() => {
    // Always trigger search, even when query is empty
    debouncedSearch(searchQuery, activeTab);
  }, [searchQuery, activeTab, debouncedSearch]);

  const animatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      glow.value,
      [0, 0.5, 1],
      ["#0F27BD", "#ffc202", "#3d576c"]
    );

    const shadowColor = interpolateColor(
      glow.value,
      [0, 0.5, 1],
      [
        "rgba(0, 255, 204, 0.5)",
        "rgba(255, 105, 180, 0.5)",
        "rgba(0, 255, 204, 0.5)",
      ]
    );

    return {
      borderColor,
      shadowColor,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 10,
      elevation: 10,
    };
  });

  const onTabPress = (tab: TabKey) => {
    setActiveTab(tab);
    const index = TABS.findIndex((t) => t.key === tab);
    if (index !== -1) {
      try {
        flatListRef.current?.scrollToIndex({ index, animated: true });
      } catch (error) {
        // Handle potential scroll error gracefully
        console.warn("Scroll to index failed:", error);
      }
    }
  };

  /** FILTERED DATA (uses API data when available, falls back to dummy data) */
  const peopleResults = useMemo(() => {
    // Always use API data if available (even when search is empty)
    if (useApiData && apiUsersResults.length >= 0) {
      return apiUsersResults;
    }
    // Return empty array when no API data available
    return [];
  }, [useApiData, apiUsersResults]);

  const brandsResults = useMemo(() => {
    // Always use API data if available (even when search is empty)
    if (useApiData && apiBrandsResults.length >= 0) {
      return apiBrandsResults;
    }
    // Return empty array when no API data available
    return [];
  }, [useApiData, apiBrandsResults]);

  const productsResults = useMemo(() => {
    // Always use API data if available (even when search is empty)
    if (useApiData && apiProductsResults.length >= 0) {
      return apiProductsResults;
    }
    // Return empty array when no API data available
    return [];
  }, [useApiData, apiProductsResults]);

  console.log("productsResults:", productsResults);

  // Calculate number of columns based on screen width
  const brandNumColumns = PAGE_WIDTH >= 375 ? 4 : 3;
  const productNumColumns = PAGE_WIDTH >= 375 ? 3 : 2;
  const columnGap = 12;
  const horizontalPadding = 16;
  const brandItemWidth =
    (PAGE_WIDTH - horizontalPadding * 2 - columnGap * (brandNumColumns - 1)) /
    brandNumColumns;
  const productItemWidth =
    (PAGE_WIDTH - horizontalPadding * 2 - columnGap * (productNumColumns - 1)) /
    productNumColumns;

  /** RENDERERS – shapes match your real mapping */
  const renderPeopleItem = ({ item }: { item: any }) => {
    const fullName = `${safe(item.first_name)} ${safe(item.last_name)}`.trim();
    return (
      <TouchableOpacity
        className="flex-row items-center px-3 py-4"
        onPress={() =>
          router.push({
            pathname: "/(profiles)/" as any,
            params: { user: item.id },
          })
        }
      >
        <View className="h-12 w-12 rounded-full bg-gray-200 mr-4 items-center justify-center">
          <Image
            source={{
              uri: item.profile_picture || "https://via.placeholder.com/40",
            }}
            resizeMode="contain"
            className="w-10 h-10 rounded-full"
          />
        </View>
        <View className="flex-1">
          <View className="flex flex-row items-center gap-2">
            {fullName.length > 0 ? (
              <Text className="text-[16px] text-[#111827] font-semibold">
                {fullName}
              </Text>
            ) : null}
            {item.is_creator ? (
              <Octicons name="verified" size={18} color="#000" />
            ) : null}
          </View>
          <Text className="text-[13px] text-gray-500">@{item.username}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBrandItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={{
        width: brandItemWidth,
        marginBottom: 16,
      }}
      className="items-center"
      activeOpacity={0.7}
    >
      <View className="w-full aspect-square bg-white rounded-xl shadow-sm items-center justify-center mb-2 border border-gray-100">
        {item.brandLogoURL ? (
          <Image
            source={{ uri: item.brandLogoURL }}
            className="w-[70%] h-[70%] rounded-lg"
            resizeMode="contain"
          />
        ) : (
          <View className="w-full h-full bg-gray-50 rounded-xl items-center justify-center">
            <Ionicons name="storefront-outline" size={32} color="#9CA3AF" />
          </View>
        )}
      </View>
      <Text
        className="text-xs font-medium text-gray-800 text-center px-1"
        numberOfLines={2}
        style={{ lineHeight: 16 }}
      >
        {item.brand_name}
      </Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: any }) => {
    const finalPrice = item.sale_price || item.regular_price;
    const hasDiscount =
      item.sale_price !== null && item.sale_price < item.regular_price;
    const discountPercentage =
      hasDiscount && item.sale_price
        ? Math.round(
            ((item.regular_price - item.sale_price) / item.regular_price) * 100
          )
        : 0;

    return (
      <TouchableOpacity
        style={{
          width: productItemWidth,
          marginBottom: 16,
        }}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
        activeOpacity={0.7}
      >
        {/* Product Image */}
        <View className="relative bg-gray-50" style={{ aspectRatio: 1 }}>
          {item.main_image ? (
            <Image
              source={{ uri: item.main_image }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons name="image-outline" size={40} color="#D1D5DB" />
            </View>
          )}

          {/* Brand Badge */}
          {item.brand.brandLogoURL && (
            <View className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white items-center justify-center shadow-sm border border-gray-100">
              <Image
                source={{ uri: item.brand.brandLogoURL }}
                className="w-6 h-6 rounded-full"
                resizeMode="contain"
              />
            </View>
          )}

          {/* Discount Badge */}
          {hasDiscount && discountPercentage > 0 && (
            <View className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded-md">
              <Text className="text-white text-[10px] font-bold">
                -{discountPercentage}%
              </Text>
            </View>
          )}
        </View>

        {/* Product Details */}
        <View className="p-3">
          <Text className="text-[10px] text-gray-500 mb-1" numberOfLines={1}>
            {item.brand.brand_name}
          </Text>
          <Text
            className="text-xs font-semibold text-gray-900 mb-2"
            numberOfLines={2}
            style={{ lineHeight: 16, minHeight: 32 }}
          >
            {item.name}
          </Text>

          {/* Price Section */}
          <View className="flex-row items-center flex-wrap">
            {hasDiscount && (
              <Text className="text-[10px] text-gray-400 line-through mr-2">
                ₹{item.regular_price}
              </Text>
            )}
            <Text className="text-sm font-bold text-gray-900">
              ₹{finalPrice}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Empty state component
  const EmptyState = ({ query }: { query: string }) => (
    <View className="flex-1 justify-center items-center p-6">
      {query ? (
        <>
          <Ionicons name="search" size={48} color="#CCCCCC" />
          <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">
            No results found
          </Text>
          <Text className="text-sm text-gray-500 text-center">
            We couldn&apos;t find anything matching &quot;{query}&quot;
          </Text>
        </>
      ) : (
        <>
          <Ionicons name="search" size={48} color="#CCCCCC" />
          <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">
            Search
          </Text>
          <Text className="text-sm text-gray-500 text-center">
            Search for users, brands, or products
          </Text>
        </>
      )}
    </View>
  );

  const renderTabContent = ({ item }: { item: { key: TabKey } }) => (
    <View style={{ width: PAGE_WIDTH }} className="flex-1 bg-[#F3F4F6]">
      {isLoading && (
        <View className="py-5 items-center">
          <ActivityIndicator size="small" color="#1a1a1a" />
        </View>
      )}
      {!isLoading &&
        item.key === "people" &&
        (peopleResults.length === 0 ? (
          <EmptyState query={searchQuery} />
        ) : (
          <FlatList
            data={peopleResults}
            keyExtractor={(u) => String(u.id)}
            renderItem={renderPeopleItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ))}
      {!isLoading &&
        item.key === "brands" &&
        (brandsResults.length === 0 ? (
          <EmptyState query={searchQuery} />
        ) : (
          <FlatList
            data={brandsResults}
            keyExtractor={(b) => String(b.id)}
            renderItem={renderBrandItem}
            numColumns={brandNumColumns}
            key={`brands-${brandNumColumns}`}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={{
              paddingHorizontal: horizontalPadding,
              gap: columnGap,
            }}
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: 20,
            }}
          />
        ))}
      {!isLoading &&
        item.key === "products" &&
        (productsResults.length === 0 ? (
          <EmptyState query={searchQuery} />
        ) : (
          <FlatList
            data={productsResults}
            keyExtractor={(p) => String(p.id)}
            renderItem={renderProductItem}
            numColumns={productNumColumns}
            key={`products-${productNumColumns}`}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={{
              paddingHorizontal: horizontalPadding,
              gap: columnGap,
            }}
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: 20,
            }}
          />
        ))}
      {!isLoading && item.key === "hashtags" && (
        <SearchPostsWithTags tag={searchQuery.toLowerCase()} />
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-[#F3F4F6]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row pb-2 items-center justify-between pr-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-2 h-10 w-10 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color="#111827"
          />
        </TouchableOpacity>

        <Animated.View
          style={[
            {
              flex: 1,
              height: 40,
              borderWidth: 2,
              borderRadius: 10,
              paddingHorizontal: 15,
              backgroundColor: "white",
              flexDirection: "row",
              alignItems: "center",
            },
            animatedStyle,
          ]}
        >
          <AnimatedTextInput
            placeholder="Search hashtags..."
            placeholderTextColor="#9ca3af"
            style={{
              flex: 1,
              fontSize: 13,
              fontFamily: "System",
            }}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Ionicons name="search" size={20} color="#555" />
        </Animated.View>
      </View>

      {/* Pills */}
      <View className="bg-[#F3F4F6] border-b border-gray-200 pb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-3 gap-3"
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => onTabPress(tab.key)}
                className={[
                  "flex-row items-center justify-center",
                  "py-2 px-3 rounded-full min-w-[160px]",
                  active ? "bg-black" : "bg-white border border-gray-200",
                ].join(" ")}
                activeOpacity={0.9}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={active ? "#fff" : "#6B7280"}
                />
                <Text
                  className={
                    active
                      ? "ml-2 text-base text-white font-semibold"
                      : "ml-2 text-base text-gray-700"
                  }
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Swipeable pages */}
      <FlatList
        ref={flatListRef}
        data={TABS}
        keyExtractor={(i) => i.key}
        horizontal
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={PAGE_WIDTH}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        renderItem={renderTabContent}
        className="flex-1"
        getItemLayout={(_, index) => ({
          length: PAGE_WIDTH,
          offset: PAGE_WIDTH * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          const index = Math.round(x / PAGE_WIDTH);
          const next = TABS[index]?.key;
          if (next && next !== activeTab) setActiveTab(next);
        }}
      />
    </View>
  );
};

export default React.memo(SearchScreen);
