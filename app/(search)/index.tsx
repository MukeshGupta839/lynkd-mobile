import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
 * DUMMY DATA (API-SHAPE COMPATIBLE)
 * ------------------------------- */

// /api/search/users -> [{id, first_name, last_name, username, profile_picture, is_creator}]
const USERS = [
  {
    id: 1,
    first_name: "NUPUR",
    last_name: "SARDA",
    username: "nupurs",
    profile_picture: "",
    is_creator: true,
  },
  {
    id: 2,
    first_name: "Andri",
    last_name: "Wijaya",
    username: "rachmancahyono06",
    profile_picture: "",
    is_creator: false,
  },
  {
    id: 3,
    first_name: "Baim",
    last_name: "",
    username: "baimggg",
    profile_picture: "",
    is_creator: false,
  },
  {
    id: 4,
    first_name: "Rinda",
    last_name: "Choiriyah",
    username: "rinda5",
    profile_picture: "",
    is_creator: false,
  },
  {
    id: 5,
    first_name: "Ayu",
    last_name: "Nduts",
    username: "ayu_widiastutu",
    profile_picture: "",
    is_creator: false,
  },
  {
    id: 6,
    first_name: "John",
    last_name: "Matthew",
    username: "matthew",
    profile_picture: "",
    is_creator: true,
  },
  {
    id: 7,
    first_name: "Farida",
    last_name: "Yanuar",
    username: "fy87",
    profile_picture: "",
    is_creator: false,
  },
  {
    id: 8,
    first_name: "Karthik",
    last_name: "Venkatesh",
    username: "karthikvenkatesh",
    profile_picture: "",
    is_creator: true,
  },
  {
    id: 9,
    first_name: "Bayu",
    last_name: "",
    username: "bayurenata",
    profile_picture: "",
    is_creator: false,
  },
  {
    id: 10,
    first_name: "Putra",
    last_name: "N",
    username: "putra.nuralim22",
    profile_picture: "",
    is_creator: false,
  },
  {
    id: 11,
    first_name: "Putra",
    last_name: "N",
    username: "putra.nuralim22",
    profile_picture: "",
    is_creator: false,
  },
  {
    id: 13,
    first_name: "Putra",
    last_name: "N",
    username: "putra.nuralim22",
    profile_picture: "",
    is_creator: false,
  },
];

// /api/search/brands -> [{id, brand_name, brandLogoURL}]
const BRANDS = [
  { id: 101, brand_name: "Acme Outfitters", brandLogoURL: "" },
  { id: 102, brand_name: "Nova Gear", brandLogoURL: "" },
  { id: 103, brand_name: "Pixel Apparel", brandLogoURL: "" },
  { id: 104, brand_name: "Orbit Shoes", brandLogoURL: "" },
  { id: 105, brand_name: "Zen Cosmetics", brandLogoURL: "" },
];

// /api/search/products -> [{id, name, regular_price, sale_price, main_image, brand:{id, brand_name, brandLogoURL}}]
const PRODUCTS = Array.from({ length: 18 }).map((_, i) => {
  const brand = BRANDS[i % BRANDS.length];
  const regular = 999 + i * 23;
  const sale = i % 3 === 0 ? regular - 120 : null;
  return {
    id: 1000 + i,
    name:
      [
        "Cotton Tee",
        "Running Shoes",
        "Denim Jacket",
        "Smart Watch",
        "Hydra Serum",
      ][i % 5] + ` #${i + 1}`,
    regular_price: regular,
    sale_price: sale,
    main_image: "",
    brand: {
      id: brand.id,
      brand_name: brand.brand_name,
      brandLogoURL: brand.brandLogoURL,
    },
  };
});

// /api/search/hashtags -> [{id,name}]  (optional)
const HASHTAGS = [
  { id: 900, name: "style" },
  { id: 901, name: "sale" },
  { id: 902, name: "tech" },
  { id: 903, name: "beauty" },
  { id: 904, name: "shoes" },
];

/** -------------------------------
 * HELPERS
 * ------------------------------- */
const contains = (a: string, b: string) =>
  a.toLowerCase().includes(b.toLowerCase());
const safe = (v?: string | null) => (v ?? "").trim();

/** -------------------------------
 * COMPONENT
 * ------------------------------- */
const SearchScreen = () => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("people");
  const flatListRef = useRef<FlatList>(null);

  const onTabPress = (tab: TabKey) => {
    setActiveTab(tab);
    const index = TABS.findIndex((t) => t.key === tab);
    if (flatListRef.current && index !== -1) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  };

  /** FILTERED DATA (mimics what API would return for ?search=) */
  const peopleResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return USERS;
    return USERS.filter(
      (u) =>
        contains(u.username, q) ||
        contains(`${safe(u.first_name)} ${safe(u.last_name)}`, q)
    );
  }, [searchQuery]);

  const brandsResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return BRANDS;
    return BRANDS.filter((b) => contains(b.brand_name, q));
  }, [searchQuery]);

  const productsResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return PRODUCTS;
    return PRODUCTS.filter(
      (p) => contains(p.name, q) || contains(p.brand.brand_name, q)
    );
  }, [searchQuery]);

  const hashtagsResults = useMemo(() => {
    const q = searchQuery.trim().replace("#", "");
    if (!q) return HASHTAGS;
    return HASHTAGS.filter((h) => contains(h.name, q));
  }, [searchQuery]);

  /** RENDERERS – shapes match your real mapping */
  const renderPeopleItem = ({ item }: { item: (typeof USERS)[number] }) => {
    const fullName = `${safe(item.first_name)} ${safe(item.last_name)}`.trim();
    return (
      <View className="flex-row items-center px-3 py-4">
        <View className="h-12 w-12 rounded-full bg-gray-200 mr-4 items-center justify-center">
          <Ionicons name="person" size={20} color="#6B7280" />
        </View>
        <View className="flex-1">
          {fullName.length > 0 ? (
            <Text className="text-[16px] text-[#111827] font-semibold">
              {fullName}
            </Text>
          ) : null}
          <Text className="text-[13px] text-gray-500">@{item.username}</Text>
        </View>
        {item.is_creator ? (
          <Ionicons name="checkmark-circle" size={18} color="#111827" />
        ) : null}
      </View>
    );
  };

  const renderBrandItem = ({ item }: { item: (typeof BRANDS)[number] }) => (
    <View className="flex-row items-center px-3 py-4">
      <View className="h-12 w-12 rounded-lg bg-white mr-4 items-center justify-center">
        {/* brand logo placeholder */}
        <Ionicons name="storefront" size={20} color="#6B7280" />
      </View>
      <Text className="text-[16px] text-[#111827] font-semibold">
        {item.brand_name}
      </Text>
    </View>
  );

  const renderProductItem = ({ item }: { item: (typeof PRODUCTS)[number] }) => (
    <View className="flex-row items-center gap-3 px-3 py-4">
      <View className="rounded-lg bg-gray-100 items-center justify-center">
        <Ionicons name="pricetag" size={18} color="#6B7280" />
      </View>
      <View className="flex-1">
        <Text className="text-[14px] text-[#6B7280]">
          {item.brand.brand_name}
        </Text>
        <Text
          className="text-[16px] text-[#111827] font-semibold"
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View className="flex-row items-center">
          {item.sale_price ? (
            <>
              <Text className="text-[12px] text-gray-400 line-through mr-2">
                ₹{item.regular_price}
              </Text>
              <Text className="text-[13px] font-semibold">
                ₹{item.sale_price}
              </Text>
            </>
          ) : (
            <Text className="text-[13px] font-semibold">
              ₹{item.regular_price}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderHashtagItem = ({ item }: { item: (typeof HASHTAGS)[number] }) => (
    <View className="px-3 py-3">
      <Text className="text-[16px] text-[#111827] font-semibold">
        #{item.name}
      </Text>
    </View>
  );

  const renderTabContent = ({ item }: { item: { key: TabKey } }) => (
    <View style={{ width: PAGE_WIDTH }} className="flex-1 bg-[#F3F4F6]">
      {item.key === "people" && (
        <FlatList
          data={peopleResults}
          keyExtractor={(u) => String(u.id)}
          renderItem={renderPeopleItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      {item.key === "brands" && (
        <FlatList
          data={brandsResults}
          keyExtractor={(b) => String(b.id)}
          renderItem={renderBrandItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      {item.key === "products" && (
        <FlatList
          data={productsResults}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderProductItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      {item.key === "hashtags" && (
        <FlatList
          data={hashtagsResults}
          keyExtractor={(h) => String(h.id)}
          renderItem={renderHashtagItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-[#F3F4F6]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center gap-2 px-3 pt-2 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="rounded-xl"
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={30}
            color="#111827"
            style={{ marginLeft: -5, marginRight: -5 }}
          />
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center bg-gray-100 border border-gray-300 h-12 rounded-xl px-4">
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            className="ml-2 flex-1 text-base text-gray-900"
            placeholder="Search users, brands, products..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              className="h-8 w-8 items-center justify-center"
              onPress={() => setSearchQuery("")}
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
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

export default SearchScreen;
