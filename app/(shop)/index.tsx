// app/Store/viewShop.tsx
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { JSX, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  ListRenderItemInfo,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { router } from "expo-router";
import {
  BEST_SELLERS,
  CATEGORIES,
  Category,
  DUMMY_STORE,
  Product,
  PRODUCTS_BY_CATEGORY,
} from "../../constants/viewshop";

const BACKGROUND =
  "https://media.istockphoto.com/id/1705316992/photo/apple-store-at-5th-ave-in-manhattan-new-york-city.jpg?s=612x612&w=0&k=20&c=CSOmNUp9s1C0MbqnH83fBJhvYbvoayHkQzIggMZSxkg=";

/* === Types for the outer FlatList items === */
type BlockHeader = { type: "header" };
type BlockBestSellers = { type: "bestSellers" };
type BlockCategories = { type: "categories" };
type BlockCategorySection = { type: "categorySection"; categoryId: number };
type BlockItem =
  | BlockHeader
  | BlockBestSellers
  | BlockCategories
  | BlockCategorySection;

export default function ViewShop(): JSX.Element {
  const insets = useSafeAreaInsets();
  const store = DUMMY_STORE;

  const [openCategories, setOpenCategories] = useState<number[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<
    Record<number, Product[]>
  >({});
  const [loadingByCategory, setLoadingByCategory] = useState<
    Record<number, boolean>
  >({});
  const [errorByCategory, setErrorByCategory] = useState<
    Record<number, string | null>
  >({});

  // Robust fetch for a category (look up constants as fallback)
  const fetchProductsForCategory = useCallback(
    async (catId: number) => {
      const cached = productsByCategory[catId];
      if (cached && cached.length > 0) return;

      setLoadingByCategory((p) => ({ ...p, [catId]: true }));
      setErrorByCategory((p) => ({ ...p, [catId]: null }));

      try {
        // simulated network delay - replace this with real API call later
        await new Promise((res) => setTimeout(res, 200));

        const fromConstants: Product[] =
          (PRODUCTS_BY_CATEGORY as any)[catId] ??
          (PRODUCTS_BY_CATEGORY as any)[String(catId)] ??
          [];

        setProductsByCategory((p) => ({ ...p, [catId]: fromConstants }));
      } catch (err: any) {
        setErrorByCategory((p) => ({
          ...p,
          [catId]: err?.message ?? "Failed",
        }));
      } finally {
        setLoadingByCategory((p) => ({ ...p, [catId]: false }));
      }
    },
    [productsByCategory]
  );

  // Single-open behaviour (open category and load products)
  const openSingleCategory = useCallback(
    (catId: number) => {
      setOpenCategories([catId]);
      fetchProductsForCategory(catId);
    },
    [fetchProductsForCategory]
  );

  const toggleCategory = useCallback(
    (catId: number) => {
      setOpenCategories((prev) =>
        prev.includes(catId) ? prev.filter((x) => x !== catId) : [catId]
      );
      if (!openCategories.includes(catId)) fetchProductsForCategory(catId);
    },
    [fetchProductsForCategory, openCategories]
  );

  // ==== small presentational product card used in grids ====
  const ProductCard = useCallback(({ product }: { product?: Product }) => {
    if (!product) return <View className="flex-1 px-3" />;
    return (
      <View className="flex-1 px-3 pb-6">
        <View className="relative h-44 w-full items-center justify-center">
          <Image
            source={{ uri: product.imageUrl ?? "https://picsum.photos/400" }}
            className="w-full h-full rounded-lg"
            resizeMode="contain"
          />
          <Pressable className="absolute right-2 bottom-2 px-3 py-1 rounded-full bg-white border border-gray-200 items-center justify-center">
            <Text className="text-orange-500 font-bold">ADD</Text>
          </Pressable>
        </View>

        <Text className="text-base font-semibold text-black mt-3 leading-5">
          {product.title}
        </Text>

        {product.storage && (
          <Text className="text-xs text-black-500 font-semibold mt-1">
            {product.storage}
          </Text>
        )}

        <View className="mt-2">
          <Text className="text-base font-bold text-black">
            {product.price}
          </Text>
        </View>
      </View>
    );
  }, []);

  // Render the small 2-column grid for a category (keeps FlatList with numColumns=2, scrollEnabled=false)
  const CategoryGrid = useCallback(
    ({ products }: { products: Product[] }) => {
      return (
        <FlatList
          data={products}
          renderItem={({ item }) => <ProductCard product={item} />}
          keyExtractor={(p) => String(p.id)}
          numColumns={2}
          scrollEnabled={false} // let parent FlatList handle scrolling
          showsVerticalScrollIndicator={false}
        />
      );
    },
    [ProductCard]
  );

  // Render BEST SELLER item (horizontal carousel item)
  const renderBestSeller = useCallback(
    ({ item }: ListRenderItemInfo<(typeof BEST_SELLERS)[number]>) => {
      return (
        <View className=" w-32 px-3">
          <View className="relative h-28 w-full items-center justify-center">
            <Image
              source={{ uri: item.imageUrl ?? "https://picsum.photos/200" }}
              className="w-full h-full rounded-lg"
              resizeMode="contain"
            />
            <Pressable className="absolute right-2 bottom-2 w-8 h-8 rounded-full bg-white border border-gray-200 items-center justify-center shadow-sm">
              <Text className="text-orange-500 text-lg font-bold">+</Text>
            </Pressable>
          </View>

          <Text className="text-base font-semibold text-black mt-2 leading-4">
            {item.title}
          </Text>

          {item.storage && (
            <Text className="text-xs text-black-500 font-semibold mt-1">
              {item.storage}
            </Text>
          )}

          <View className="mt-2">
            <Text className="text-base font-bold text-black">{item.price}</Text>
          </View>
        </View>
      );
    },
    []
  );

  // Category chip render
  const renderCategoryChip = useCallback(
    ({ item }: ListRenderItemInfo<Category>) => {
      return (
        <Pressable
          className=" px-3 items-center"
          onPress={() => openSingleCategory(item.id)}>
          <View className="w-20 h-20 rounded-xl bg-orange-50 items-center justify-center overflow-hidden">
            <Image
              source={{ uri: item.imageUrl ?? "https://picsum.photos/200" }}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>
          <Text className="text-xs mt-2">{item.label}</Text>
        </Pressable>
      );
    },
    [openSingleCategory]
  );

  // Prepare the top-level FlatList data blocks: header, bestSellers, categories, then each categorySection
  const blocks = useMemo<BlockItem[]>(() => {
    const base: BlockItem[] = [
      { type: "header" },
      { type: "bestSellers" },
      { type: "categories" },
    ];
    const sections: BlockItem[] = CATEGORIES.map((c) => ({
      type: "categorySection",
      categoryId: c.id,
    }));
    return [...base, ...sections];
  }, []);

  // RENDERERS for each block type
  const renderHeaderBlock = useCallback(() => {
    return (
      <View>
        {/* HEADER / HERO */}
        <View className="h-72 w-full overflow-hidden rounded-b-2xl relative">
          <Image
            source={{ uri: BACKGROUND }}
            className="absolute inset-0 w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/12" />

          <View
            className="flex-row justify-between px-3"
            style={{ paddingTop: insets.top }}>
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/90 items-center justify-center">
              <Ionicons name="chevron-back" size={20} color="#111827" />
            </Pressable>

            <Pressable className="w-10 h-10 rounded-full bg-white/90 items-center justify-center">
              <Ionicons name="search" size={18} color="#111827" />
            </Pressable>
          </View>

          <BlurView
            intensity={60}
            tint="light"
            className="absolute left-2 right-2 bottom-2 rounded-2xl overflow-hidden">
            <View className="bg-white p-4">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-2xl font-extrabold text-gray-900">
                    {store.name}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {store.location}
                  </Text>
                </View>

                <View className="items-end">
                  <Image
                    source={{ uri: store.logoUrl }}
                    resizeMode="cover"
                    className="w-16 h-16 rounded-xl bg-white"
                  />
                </View>
              </View>

              <View className="border-t border-gray-200 mt-2 pt-2" />

              <View className="mt-1 flex-row items-center">
                <View className="flex-row items-center">
                  <Ionicons name="star" size={14} color="#16a34a" />
                  <Text className="ml-2 text-sm text-gray-700">
                    {store.rating}{" "}
                    <Text className="text-gray-500">
                      ({store.reviewsCount}+){" "}
                    </Text>
                  </Text>
                </View>

                <View className="mx-3 h-0.5 w-0.5 bg-gray-300" />

                <View className="flex-row items-center">
                  <Ionicons name="time" size={16} color="#111827" />
                  <Text className="ml-2 text-sm text-gray-700">
                    {store.deliveryTime}
                  </Text>
                </View>

                <View className="mx-3 h-0.5 w-0.5 bg-gray-300" />

                <View className="flex-row items-center">
                  <Text className="text-sm text-gray-700">Delivery:</Text>
                  <Text className="ml-2 text-sm font-extrabold text-green-600">
                    {store.deliveryLabel}
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>
        </View>

        {/* FREE DELIVERY & PROMO */}
        <View className="w-full bg-orange-100">
          <View className="w-full rounded-t-2xl border-b border-gray-100 ">
            <View className="px-3 pt-4 pb-4">
              <View className="flex-row items-start">
                <View className="w-12 h-12 rounded-lg bg-orange-50 mr-3 items-center justify-center">
                  <View className="w-8 h-8 rounded-md bg-orange-100 items-center justify-center">
                    <Ionicons name="pricetag" size={18} color="#f97316" />
                  </View>
                </View>

                <View className="flex-1">
                  <Text className="text-base font-extrabold text-gray-800">
                    FREE DELIVERY
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-sm text-gray-500">Min order: 25</Text>
                    <Text className="mx-2 text-sm text-gray-300">•</Text>
                    <Text className="text-sm text-gray-500">AUTO APPLIED</Text>
                  </View>
                </View>

                <Pressable className="ml-3 w-8 h-8 rounded-full border border-gray-200 items-center justify-center ">
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#6b7280"
                  />
                </Pressable>
              </View>
            </View>
          </View>

          <View className="w-full bg-white rounded-t-2xl">
            <View className="px-2 pb-6 pt-4">
              <View className="rounded-2xl overflow-hidden bg-black py-5 items-center justify-center">
                <Text className="text-sm text-white font-medium">
                  Promo banner / ad
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }, [insets.top, store]);

  const renderBestSellersBlock = useCallback(() => {
    return (
      <View>
        <View className="flex-row items-center justify-center my-6 px-2">
          <View className="flex-1 h-px bg-gray-200" />
          <View className="w-2 h-2 bg-gray-200 mx-2 rotate-45 rounded-[1px]" />
          <Text className="mx-2 text-base font-extrabold tracking-tight text-black">
            BEST SELLERS
          </Text>
          <View className="w-2 h-2 bg-gray-200 mx-2 rotate-45 rounded-[1px]" />
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        <FlatList
          data={BEST_SELLERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderBestSeller}
        />
      </View>
    );
  }, [renderBestSeller]);

  const renderCategoriesBlock = useCallback(() => {
    return (
      <View className="mt-8">
        <View className="flex-row items-center justify-center my-4 ">
          <View className="flex-1 h-px bg-gray-200" />
          <View className="w-2 h-2 bg-gray-200 mx-2 rotate-45 rounded-[1px]" />
          <Text className="mx-2 text-base font-extrabold tracking-tight text-black">
            SHOP BY CATEGORY
          </Text>
          <View className="w-2 h-2 bg-gray-200 mx-2 rotate-45 rounded-[1px]" />
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCategoryChip}
        />
      </View>
    );
  }, [renderCategoryChip]);

  // Render a category section block (header + optional grid)
  const renderCategorySectionBlock = useCallback(
    ({ categoryId }: { categoryId: number }) => {
      const cat = CATEGORIES.find((c) => c.id === categoryId)!;
      const isOpen = openCategories.includes(categoryId);
      const productsFromApi = productsByCategory[categoryId] ?? [];
      const constantsLookup: Product[] =
        (PRODUCTS_BY_CATEGORY as any)[categoryId] ??
        (PRODUCTS_BY_CATEGORY as any)[String(categoryId)] ??
        [];
      const fallback: Product[] =
        constantsLookup.length > 0 ? constantsLookup : BEST_SELLERS.slice(0, 4);

      const productsToShow =
        productsFromApi && productsFromApi.length > 0
          ? productsFromApi.slice(0, 4)
          : fallback.slice(0, 4);

      const loading = !!loadingByCategory[categoryId];
      const error = errorByCategory[categoryId] ?? null;

      return (
        <View key={categoryId} className="border-b border-gray-100 pb-4">
          <Pressable
            className="flex-row items-center justify-between px-4 py-4"
            onPress={() => toggleCategory(categoryId)}>
            <Text className="text-lg font-extrabold text-black">
              {cat.label}
            </Text>
            <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
              <Ionicons
                name={isOpen ? "chevron-up" : "chevron-down"}
                size={20}
                color="#374151"
              />
            </View>
          </Pressable>

          {isOpen && (
            <View className="px-2">
              {loading ? (
                <View
                  style={{
                    height: 220,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  <Text>Loading...</Text>
                </View>
              ) : error ? (
                <View style={{ padding: 12 }}>
                  <Text>Error: {error}</Text>
                </View>
              ) : productsToShow.length === 0 ? (
                <View
                  style={{
                    height: 220,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  <Text>No products available</Text>
                </View>
              ) : (
                <CategoryGrid products={productsToShow} />
              )}
            </View>
          )}
        </View>
      );
    },
    [
      openCategories,
      productsByCategory,
      loadingByCategory,
      errorByCategory,
      toggleCategory,
    ]
  );

  // Outer FlatList renderItem - branch on block type
  const renderBlock = useCallback(
    ({ item }: ListRenderItemInfo<BlockItem>) => {
      switch (item.type) {
        case "header":
          return renderHeaderBlock();
        case "bestSellers":
          return renderBestSellersBlock();
        case "categories":
          return renderCategoriesBlock();
        case "categorySection":
          return renderCategorySectionBlock({ categoryId: item.categoryId });
        default:
          return null;
      }
    },
    [
      renderHeaderBlock,
      renderBestSellersBlock,
      renderCategoriesBlock,
      renderCategorySectionBlock,
    ]
  );

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={blocks}
        renderItem={renderBlock}
        keyExtractor={(item, index) =>
          item.type === "categorySection"
            ? `cat-${item.categoryId}`
            : `${item.type}-${index}`
        }
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={7}
      />
    </View>
  );
}
