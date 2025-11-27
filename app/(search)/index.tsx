import SearchPostsWithTags from "@/components/SearchPostsWithTags";
import SearchBar from "@/components/Searchbar";
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
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiCall } from "../../lib/api/apiService";

const { width: PAGE_WIDTH } = Dimensions.get("window");

type TabKey = "people" | "brands" | "products" | "hashtags";

type SearchUser = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  profile_picture: string | null;
  is_creator: boolean;
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "people", label: "People" },
  { key: "brands", label: "Brands" },
  { key: "products", label: "Products" },
  { key: "hashtags", label: "Hashtags" },
];

/** -------------------------------
 * HELPERS
 * ------------------------------- */
const safe = (v?: string | null) => (v ?? "").trim();
const replaceNull = (value: any) => (value === null ? "" : value);

/** -------------------------------
 * COMPONENT
 * ------------------------------- */
const SearchScreen = () => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("people");
  const flatListRef = useRef<FlatList<{ key: TabKey }> | null>(null);

  // API-fetched results state
  const [apiUsersResults, setApiUsersResults] = useState<SearchUser[]>([]);
  const [apiBrandsResults, setApiBrandsResults] = useState<any[]>([]);
  const [apiProductsResults, setApiProductsResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useApiData, setUseApiData] = useState(false);

  // API fetch functions
  const fetchUsersBySearch = useCallback(async (query: string) => {
    try {
      const response = await apiCall(
        `/api/search/users?search=${query}`,
        "GET"
      );
      const data = response.data;

      const users: SearchUser[] = data.map(
        (user: any): SearchUser => ({
          id: user.id,
          first_name: replaceNull(user.first_name),
          last_name: replaceNull(user.last_name),
          username: user.username,
          profile_picture: user.profile_picture,
          is_creator: user.is_creator,
        })
      );

      const q = query.toLowerCase();

      const score = (username: string) => {
        const u = username.toLowerCase();
        if (u === q) return 0; // exact match
        if (u.startsWith(q)) return 1; // prefix match
        if (u.includes(q)) return 2; // substring match
        return 3; // no match
      };

      // ✅ TS now knows a and b are SearchUser
      users.sort((a, b) => {
        const sa = score(a.username);
        const sb = score(b.username);

        if (sa !== sb) return sa - sb;

        // tie-breaker: alphabetical
        return a.username.localeCompare(b.username);
      });

      setApiUsersResults(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      setApiUsersResults([]);
    }
  }, []);

  const fetchBrandsBySearch = useCallback(async (query: string) => {
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

  const fetchProductsBySearch = useCallback(async (query: string) => {
    try {
      const response = await apiCall(
        `/api/search/products?search=${query}`,
        "GET"
      );
      const data = response.data;

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
          const searchTerm = query.trim() || "a";
          if (tab === "people") await fetchUsers(searchTerm);
          else if (tab === "brands") await fetchBrands(searchTerm);
          else if (tab === "products") await fetchProducts(searchTerm);
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
        fetchUsersBySearch,
        fetchBrandsBySearch,
        fetchProductsBySearch,
        setIsLoading,
        setUseApiData,
        () => {
          setApiUsersResults([]);
          setApiBrandsResults([]);
          setApiProductsResults([]);
        }
      );
    },
    [fetchUsersBySearch, fetchBrandsBySearch, fetchProductsBySearch]
  );

  // Fetch default results for all tabs on mount
  useEffect(() => {
    const fetchDefaultResults = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchUsersBySearch("a"),
          fetchBrandsBySearch("a"),
          fetchProductsBySearch("a"),
        ]);
        setUseApiData(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDefaultResults();
  }, [fetchUsersBySearch, fetchBrandsBySearch, fetchProductsBySearch]);

  // Trigger search when query or tab changes
  useEffect(() => {
    debouncedSearch(searchQuery, activeTab);
  }, [searchQuery, activeTab, debouncedSearch]);

  /** FILTERED DATA */
  const peopleResults = useMemo(
    () => (useApiData ? apiUsersResults : []),
    [useApiData, apiUsersResults]
  );
  const brandsResults = useMemo(
    () => (useApiData ? apiBrandsResults : []),
    [useApiData, apiBrandsResults]
  );
  const productsResults = useMemo(
    () => (useApiData ? apiProductsResults : []),
    [useApiData, apiProductsResults]
  );

  // Layout helpers
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

  /** RENDERERS */
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
          {/* username WITHOUT @ */}
          <Text className="text-[13px] text-gray-500">{item.username}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBrandItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={{ width: brandItemWidth, marginBottom: 16 }}
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
        style={{ width: productItemWidth, marginBottom: 16 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
        activeOpacity={0.7}
      >
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

          {/* {item.brand.brandLogoURL && (
            <View className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white items-center justify-center shadow-sm border border-gray-100">
              <Image
                source={{ uri: item.brand.brandLogoURL }}
                className="w-6 h-6 rounded-full"
                resizeMode="contain"
              />
            </View>
          )} */}

          {hasDiscount && discountPercentage > 0 && (
            <View className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded-md">
              <Text className="text-white text-[10px] font-bold">
                -{discountPercentage}%
              </Text>
            </View>
          )}
        </View>

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
          <View className="flex-row items-center flex-wrap">
            <Text className="text-sm font-bold text-gray-900">
              ₹{finalPrice}
            </Text>

            {hasDiscount && (
              <Text className="text-[10px] text-gray-400 line-through ml-2">
                ₹{item.regular_price}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Empty state
  const EmptyState = ({ query }: { query: string }) => (
    <View className="flex-1 justify-center items-center p-6">
      <Ionicons name="search" size={48} color="#CCCCCC" />
      {query ? (
        <>
          <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">
            No results found
          </Text>
          <Text className="text-sm text-gray-500 text-center">
            We couldn&apos;t find anything matching &quot;{query}&quot;
          </Text>
        </>
      ) : (
        <>
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
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
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
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
          />
        ))}
      {!isLoading && item.key === "hashtags" && (
        <SearchPostsWithTags tag={searchQuery.toLowerCase()} />
      )}
    </View>
  );

  const onTabPress = (tab: TabKey) => {
    setActiveTab(tab);
    const index = TABS.findIndex((t) => t.key === tab);
    if (index !== -1) {
      try {
        flatListRef.current?.scrollToIndex({ index, animated: true });
      } catch (e) {
        console.warn("Scroll to index failed:", e);
      }
    }
  };

  return (
    <View className="flex-1 bg-[#F3F4F6]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row pb-2 items-center justify-between pr-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={32}
            color="#111827"
          />
        </TouchableOpacity>

        {/* Shared SearchBar — no local placeholder/height overrides to stay in sync */}
        <View className="flex-1 ">
          <SearchBar
            placeholder="Search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tabs (old pill style, no icons, active = gray, reduced padding) */}
      <View className="bg-[#F3F4F6] border-b border-gray-200 pb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-3 gap-3 items-center"
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => onTabPress(tab.key)}
                activeOpacity={0.9}
                className={[
                  "flex-row items-center justify-center",
                  "py-2 px-3 rounded-full min-w-[140px]",
                  active
                    ? "bg-gray-200 border-gray-200"
                    : "bg-white border-gray-200",
                ].join(" ")}
              >
                <Text
                  className={[
                    "text-base",
                    active ? "text-[#111827] font-semibold" : "text-gray-700",
                  ].join(" ")}
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
