// app/Store/viewShop.tsx (or replace your current file)

import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Banner from "@/components/Product/BannerCarousel";
import BestDealsGrid from "@/components/Product/BestDealsGrid";
import BestProductsCarousel from "@/components/Product/BestProductsCarousel";
import DealsStrip from "@/components/Product/TopDealsSection";

import { homeBannerData } from "@/constants/Banner";
import { bestDeals } from "@/constants/BestDeals";
import { topDeals } from "@/constants/Deal";
import { products } from "@/constants/Product";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

// ------- (optional) type your bottom tabs if needed -------
type TabParamList = {
  Home: undefined;
  Services: undefined;
};
type ProductNavProp = BottomTabNavigationProp<TabParamList, "Home">;

const ViewShopScreen = () => {
  const router = useRouter();
  const navigation = useNavigation<ProductNavProp>();
  const isFocused = useIsFocused();

  // FlatList ref + a refreshKey so we can soft-refresh on tab re-press
  const listRef = useRef<FlatList<any> | null>(null);
  const [refreshKey, setRefreshKey] = useState(() => Date.now());

  useEffect(() => {
    const sub = navigation.addListener("tabPress", () => {
      if (isFocused) {
        try {
          listRef.current?.scrollToOffset({ offset: 0, animated: true });
        } catch {}
        setRefreshKey(Date.now());
      }
    });
    return sub;
  }, [navigation, isFocused]);

  // content sections — ONLY the 4 you asked for
  const contentSections = [
    { id: "banner", type: "banner" as const },
    { id: "bestProducts", type: "bestProducts" as const },
    { id: "bestDeals", type: "bestDeals" as const },
    { id: "topDeals", type: "topDeals" as const },
  ];

  const renderContentSection = ({
    item,
  }: {
    item: (typeof contentSections)[number];
  }) => {
    switch (item.type) {
      case "banner":
        return (
          <View className="mt-2">
            <Banner variant="home" data={homeBannerData} />
          </View>
        );

      case "bestProducts":
        return (
          <BestProductsCarousel title="Best Products for you" data={products} />
        );

      case "bestDeals":
        return <BestDealsGrid title="Best Deals for you" data={bestDeals} />;

      case "topDeals":
        return <DealsStrip title="Top Deals" data={topDeals} />;

      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right"]}>
      <FlatList
        key={String(refreshKey)}
        ref={listRef}
        data={contentSections}
        renderItem={renderContentSection}
        keyExtractor={(item) => item.id}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingBottom: 24,
          gap: 16,
        }}
        removeClippedSubviews
        maxToRenderPerBatch={4}
        updateCellsBatchingPeriod={50}
        initialNumToRender={3}
        windowSize={6}
      />
    </SafeAreaView>
  );
};

export default ViewShopScreen;
