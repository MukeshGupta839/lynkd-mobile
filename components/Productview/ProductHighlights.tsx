// components/Productview/ProductHighlights.tsx
import { Ionicons } from "@expo/vector-icons";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Image,
  LayoutAnimation,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
// Use RNGH scrollers for reliable nested gestures
import { ScrollView as GHScrollView } from "react-native-gesture-handler";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ------------------------- Types ------------------------- */
export type KV = { label: string; value: string };

export type TopHighlights = {
  rows: KV[];
  bullets?: string[];
  description?: string;
  maxLines?: number;
};

export type SpecCategory = { id: string; title: string; rows: KV[] };

export type BrandAbout = { badge?: string; name: string; bullets: string[] };

export type Gallery = { images: { uri: string }[] };
export type BoxItems = { items: string[] };

export type SizeGuideDatasetLegacy = {
  unit: "in" | "cm";
  columns: string[];
  rows: Record<string, string | number>[];
  note?: string;
};

export type SizeGuideDatasetSticky = {
  unit: "in" | "cm";
  rowLabels: string[]; // ["Brand Size","Chest","Length"]
  colLabels: string[]; // ["S","M","L","XL", ...]
  values: Record<string, Record<string, string | number>>;
  note?: string;
};

export type SizeGuideDataset = SizeGuideDatasetLegacy | SizeGuideDatasetSticky;

export type SizeGuide = {
  datasets: SizeGuideDataset[];
  title?: string; // "Size guide"
  metaTitle?: string; // "Veirdo Size Chart"
  metaSubtitle?: string; // "IN OVERSIZED T-SHIRT"
};

export type AdditionalInfo = { title?: string; rows: KV[] };

export type ProductDetailsData = {
  topHighlights: TopHighlights;
  specifications: {
    title?: string;
    tabs: SpecCategory[];
    defaultTabId?: string;
  };
  aboutBrand: BrandAbout;
  gallery?: Gallery;
  inTheBox?: BoxItems;
  sizeGuide?: SizeGuide; // clothing
  additionalInfo?: AdditionalInfo;
};

type Props = {
  data: ProductDetailsData;
  kind?: "phone" | "facewash" | "clothing";
  showGallery?: boolean;
  showWhatsInBox?: boolean;
  /** Optional: parent can lock its FlatList when gallery is open */
  onGalleryOpenChange?: (open: boolean) => void;
};

export type ProductHighlightsHandle = {
  openSizeGuide: () => void;
  getSizeGuideY: () => number;
  /** Absolute Y of the Size Guide header within the parent scroll content */
  getSizeGuideAbsoluteY: () => number;
  /** NEW: measure the Size guide header Y on screen (post-layout) */
  measureSizeGuideScreenY: (cb: (yOnScreen: number) => void) => void;
};

/* --------------------- UI helpers --------------------- */
const Chevron: React.FC<{ open: boolean }> = ({ open }) => {
  const anim = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [open]);
  const rotation = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });
  return (
    <Animated.View style={{ transform: [{ rotateZ: rotation }] }}>
      <Ionicons name="chevron-forward" size={18} color="#000" />
    </Animated.View>
  );
};

const Divider = () => <View className="h-[1px] bg-gray-100" />;

const Row: React.FC<KV> = ({ label, value }) => (
  <View className="flex-row py-1">
    <Text className="w-44 shrink-0 pr-3 font-semibold text-gray-800">
      {label}
    </Text>
    <Text className="flex-1 text-gray-700">{value}</Text>
  </View>
);

/* Collapsible Section component (default: CLOSED) */
const Section: React.FC<{
  title: string;
  initiallyOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, initiallyOpen = false, children }) => {
  const [open, setOpen] = useState(initiallyOpen);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };
  return (
    <View>
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        className="flex-row items-center justify-between px-3 py-3">
        <Text className="text-base font-semibold text-gray-900">{title}</Text>
        <Chevron open={open} />
      </TouchableOpacity>
      {open && <View className="bg-white px-3 pb-4">{children}</View>}
      <Divider />
    </View>
  );
};

/* -------------- helpers for dataset type -------------- */
const isStickyDataset = (d: SizeGuideDataset): d is SizeGuideDatasetSticky =>
  (d as any).rowLabels && (d as any).colLabels && (d as any).values;

/* ----------------- Legacy table ----------------- */
const SizeTableLegacy: React.FC<{ dataset: SizeGuideDatasetLegacy }> = ({
  dataset,
}) => {
  const { columns, rows } = dataset;
  return (
    <View className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
      <View className="bg-gray-50 px-3 py-2 flex-row border-b border-gray-200">
        {columns.map((c, i) => (
          <Text
            key={i}
            className={`text-xs font-semibold text-gray-800 ${
              i === 0 ? "w-28 pr-2" : "flex-1 text-center"
            }`}>
            {c}
          </Text>
        ))}
      </View>
      {rows.map((r, idx) => (
        <View key={idx} className="px-3 py-2 flex-row border-t border-gray-200">
          {columns.map((c, i) => (
            <Text
              key={i}
              className={`text-sm text-gray-800 ${
                i === 0 ? "w-28 pr-2" : "flex-1 text-center"
              }`}>
              {String(r[c] ?? "")}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
};

/* ----------------- Sticky table ----------------- */
const SizeGuideStickyTable: React.FC<{ dataset: SizeGuideDatasetSticky }> = ({
  dataset,
}) => {
  const LEFT_W = 80; // sticky label column width
  const CELL_W = 90; // each value column width

  const headerRef = useRef<GHScrollView>(null as any);
  const bodyRef = useRef<GHScrollView>(null as any);
  const lastX = useRef(0);

  const onBodyScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    if (x === lastX.current) return;
    lastX.current = x;
    headerRef.current?.scrollTo({ x, animated: false });
  };

  const { rowLabels, colLabels, values } = dataset;

  return (
    <View className="rounded-2xl bg-white overflow-hidden">
      {/* Header (kept invisible; only syncs scroll) */}
      <View className="flex-row bg-gray-50">
        <GHScrollView
          horizontal
          ref={headerRef}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Body */}
      <View className="flex-row">
        {/* Left sticky labels */}
        <View style={{ width: LEFT_W }}>
          {rowLabels.map((r, i) => (
            <View key={i} className="py-2 justify-center">
              <Text className="text-sm font-semibold text-gray-800">{r}</Text>
            </View>
          ))}
        </View>

        {/* Scrollable values */}
        <GHScrollView
          horizontal
          ref={bodyRef}
          onScroll={onBodyScroll}
          scrollEventThrottle={16}
          bounces={false}
          overScrollMode="never"
          decelerationRate="normal"
          showsHorizontalScrollIndicator={false}>
          <View className="flex-row">
            {colLabels.map((c, colIdx) => (
              <View key={colIdx} style={{ width: CELL_W }}>
                {rowLabels.map((r, rowIdx) => (
                  <View
                    key={`${r}-${rowIdx}`}
                    className={`py-2 px-3 bg-white ${
                      rowIdx !== rowLabels.length - 1
                        ? "border-b border-gray-200"
                        : ""
                    }`}>
                    <Text className="text-sm text-gray-800">
                      {String(values?.[r]?.[c] ?? "")}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </GHScrollView>
      </View>

      {/* Vertical divider between sticky and scroll area */}
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: LEFT_W,
          width: 1,
          backgroundColor: "#E5E7EB",
        }}
        pointerEvents="none"
      />
    </View>
  );
};

/* --------------------- Main Component --------------------- */
const ProductHighlights = forwardRef<ProductHighlightsHandle, Props>(
  (
    {
      data,
      kind,
      showGallery = false,
      showWhatsInBox = false,
      onGalleryOpenChange,
    },
    ref
  ) => {
    const {
      topHighlights,
      specifications,
      aboutBrand,
      gallery,
      inTheBox,
      sizeGuide,
      additionalInfo,
    } = data;

    const isClothing = kind === "clothing" || !!sizeGuide;

    // description expand
    const [descExpanded, setDescExpanded] = useState(false);

    // Size guide state (INITIALLY CLOSED)
    const [sizeOpen, setSizeOpen] = useState(false);
    const [unit, setUnit] = useState<"in" | "cm">(
      (sizeGuide?.datasets?.[0] as any)?.unit ?? "in"
    );
    const activeDataset =
      sizeGuide?.datasets.find((d) => (d as any).unit === unit) ??
      sizeGuide?.datasets?.[0];

    // Specifications tabs (default CLOSED section; tabs inside)
    const initialTab = useMemo(
      () => specifications.defaultTabId ?? specifications.tabs[0]?.id,
      [specifications]
    );
    const [activeTab, setActiveTab] = useState<string | undefined>(initialTab);
    useEffect(() => setActiveTab(initialTab), [initialTab]);
    const activeRows: KV[] =
      specifications.tabs.find((t) => t.id === activeTab)?.rows ?? [];

    const sizeGuideHeaderY = useRef(0);
    const containerY = useRef(0);
    const sizeGuideHeaderRef = useRef<View>(null);

    // --- Expose open + Y methods to parent ---
    useImperativeHandle(ref, () => ({
      openSizeGuide: () => {
        if (!sizeOpen) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setSizeOpen(true);
        }
      },
      getSizeGuideY: () => sizeGuideHeaderY.current,
      getSizeGuideAbsoluteY: () =>
        containerY.current + sizeGuideHeaderY.current,
      measureSizeGuideScreenY: (cb: (yOnScreen: number) => void) => {
        // Defer to next frame so layout is up-to-date
        requestAnimationFrame(() => {
          sizeGuideHeaderRef.current?.measureInWindow?.(
            (_x: number, y: number) => cb(y)
          );
        });
      },
    }));

    /* ---------- Product image gallery state ---------- */
    const [galleryOpen, setGalleryOpen] = useState(false); // CLOSED by default
    const preview = (gallery?.images ?? []).slice(0, 3);

    const toggleGallery = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setGalleryOpen((v) => {
        const next = !v;
        // Keep parent list scrollable so the whole page scrolls
        onGalleryOpenChange?.(false);
        return next;
      });
    };

    return (
      <View
        className="w-full bg-white shadow-sm border border-gray-100"
        // Capture our top position in the parent scroll content
        onLayout={(e) => {
          containerY.current = Math.round(e.nativeEvent.layout.y);
        }}>
        {/* Product details heading */}
        <View className="px-3 pt-4 pb-2">
          <Text className="text-lg font-semibold text-gray-900">
            Product details
          </Text>
        </View>
        <Divider />

        {/* Top highlights — stays OPEN */}
        <View>
          <View className="flex-row items-center justify-between px-3 py-3">
            <Text className="text-base font-semibold text-gray-900">
              Top highlights
            </Text>
            <Chevron open />
          </View>
          <View className="bg-white px-3 pb-4">
            {topHighlights.rows.map((kv, i) => (
              <Row key={`${kv.label}-${i}`} {...kv} />
            ))}

            {topHighlights.bullets?.length ? (
              <View className="mt-3">
                {topHighlights.bullets.map((b, i) => (
                  <View key={i} className="flex-row items-start">
                    <Text className="mr-2 text-lg leading-5">•</Text>
                    <Text className="flex-1 text-base leading-5 text-gray-700">
                      {b}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {!!topHighlights.description && (
              <View className="mt-2">
                <Text
                  numberOfLines={
                    descExpanded ? undefined : (topHighlights.maxLines ?? 3)
                  }
                  className="text-base leading-5 text-gray-700">
                  {topHighlights.description}
                </Text>
                <TouchableOpacity
                  onPress={() => setDescExpanded((v) => !v)}
                  className="mt-1 self-start"
                  activeOpacity={0.7}>
                  <Text className="text-base font-semibold text-blue-600">
                    {descExpanded ? "See less" : "See more"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Divider />
        </View>

        {/* Size guide — CLOSED initially */}
        {isClothing && sizeGuide?.datasets?.length ? (
          <View
            onLayout={(e) => {
              sizeGuideHeaderY.current = e.nativeEvent.layout.y;
            }}>
            {/* header row (dropdown handle) */}
            <TouchableOpacity
              // attach ref so the parent can measure on screen
              ref={sizeGuideHeaderRef as any}
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut
                );
                setSizeOpen((v) => !v);
              }}
              activeOpacity={0.7}
              className="flex-row items-center justify-between px-3 py-3">
              <Text className="text-base font-semibold text-gray-900">
                {sizeGuide.title ?? "Size guide"}
              </Text>
              <Chevron open={sizeOpen} />
            </TouchableOpacity>

            {sizeOpen && (
              <View className="bg-white px-3 pb-4">
                {/* Header: left text + right unit toggle */}
                <View className="mb-2 px-3 flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm font-semibold text-gray-900">
                      {sizeGuide.metaTitle ?? "Veirdo Size Chart"}
                    </Text>
                    <Text className="text-sm text-gray-600 mt-2">
                      {sizeGuide.metaSubtitle ?? "IN OVERSIZED T-SHIRT"}
                    </Text>
                  </View>

                  {sizeGuide.datasets.length > 1 && (
                    <View
                      className="flex-row border border-gray-300 mt-2"
                      style={{
                        borderRadius: 8,
                        overflow: "hidden",
                        borderColor: "#000000ff",
                        width: 90,
                        height: 32,
                      }}>
                      {(["in", "cm"] as const).map((u, idx) => {
                        const selected = unit === u;
                        return (
                          <TouchableOpacity
                            key={u}
                            onPress={() => setUnit(u)}
                            activeOpacity={0.8}
                            className="flex-1 items-center justify-center"
                            style={{
                              backgroundColor: selected
                                ? "#262829ff"
                                : "#FFFFFF",
                              borderRightWidth: idx === 0 ? 1 : 0,
                              borderRightColor: "#000000ff",
                            }}>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: selected ? "600" : "500",
                                color: selected ? "#ffffffff" : "#000000ff",
                              }}>
                              {u}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Table */}
                {activeDataset &&
                  (isStickyDataset(activeDataset) ? (
                    <SizeGuideStickyTable dataset={activeDataset} />
                  ) : (
                    <SizeTableLegacy
                      dataset={activeDataset as SizeGuideDatasetLegacy}
                    />
                  ))}
              </View>
            )}
            <Divider />
          </View>
        ) : null}

        {/* Product Specifications — default CLOSED */}
        <Section title={specifications.title ?? "Product specifications"}>
          <GHScrollView horizontal showsHorizontalScrollIndicator={false}>
            {specifications.tabs.map((t) => {
              const active = activeTab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setActiveTab(t.id)}
                  activeOpacity={0.8}
                  className={`mr-2 mb-2 rounded-full px-3 py-1.5 ${
                    active
                      ? "bg-blue-50 border border-blue-500"
                      : "bg-white border border-gray-300"
                  }`}>
                  <Text
                    className={`text-sm ${active ? "text-blue-700 font-semibold" : "text-gray-700"}`}>
                    {t.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </GHScrollView>

          <View>
            {activeRows.map((kv, i) => (
              <View key={`${kv.label}-${i}`}>
                <Row {...kv} />
              </View>
            ))}
          </View>
        </Section>

        {/* About the Brand — default CLOSED */}
        <Section title="About the Brand">
          <View className="flex-row items-center mb-2">
            {aboutBrand.badge ? (
              <View className="mr-2 rounded px-2 py-0.5 bg-gray-800">
                <Text className="text-white text-[11px]">
                  {aboutBrand.badge}
                </Text>
              </View>
            ) : null}
            <Text className="text-base font-semibold text-gray-900">
              {aboutBrand.name}
            </Text>
          </View>
          {aboutBrand.bullets.map((b, i) => (
            <View key={i} className="flex-row items-start mb-2">
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <Text className="ml-2 flex-1 text-[13px] leading-5 text-gray-700">
                {b}
              </Text>
            </View>
          ))}
        </Section>

        {/* ---------- Product image gallery (page-scrolling, no containers) ---------- */}
        {showGallery && !isClothing && !!gallery?.images?.length && (
          <View>
            {/* Collapsed header with 3 thumbs */}
            <TouchableOpacity
              onPress={toggleGallery}
              activeOpacity={0.8}
              className="px-3 py-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-gray-900">
                  Product image gallery
                </Text>
                <Chevron open={galleryOpen} />
              </View>

              {/* PREVIEW: 3 plain images (no border/rounded container) */}
              {!galleryOpen && (
                <View className="mt-3 flex-row">
                  {preview.map((img, i) => (
                    <Image
                      key={`pv-${i}`}
                      source={img}
                      resizeMode="contain"
                      style={{
                        width: 96,
                        height: 96,
                        marginRight: i !== preview.length - 1 ? 12 : 0,
                      }}
                    />
                  ))}
                </View>
              )}
            </TouchableOpacity>

            {/* EXPANDED: plain images inline (no wrapper container) */}
            {galleryOpen && (
              <View className="bg-white px-3 pb-3">
                {gallery.images.map((img, i) => (
                  <Image
                    key={`full-${i}`}
                    source={img}
                    resizeMode="contain"
                    style={{
                      width: "100%",
                      height: 340,
                      marginBottom: i !== gallery.images.length - 1 ? 12 : 0,
                    }}
                  />
                ))}
              </View>
            )}

            <Divider />
          </View>
        )}

        {/* What's in the box — default CLOSED */}
        {showWhatsInBox && !isClothing && !!inTheBox?.items?.length && (
          <Section title={"What's in the box"}>
            {inTheBox.items.map((it, i) => (
              <View key={i} className="flex-row items-start mb-2">
                <Text className="mr-2 text-lg leading-5">•</Text>
                <Text className="flex-1 text-[13px] leading-5 text-gray-700">
                  {it}
                </Text>
              </View>
            ))}
          </Section>
        )}

        {/* Additional info — default CLOSED */}
        {!!additionalInfo?.rows?.length && (
          <Section title={additionalInfo.title ?? "Additional Information"}>
            {additionalInfo.rows.map((kv, i) => (
              <Row key={`${kv.label}-${i}`} {...kv} />
            ))}
          </Section>
        )}
      </View>
    );
  }
);

ProductHighlights.displayName = "ProductHighlights";
export default ProductHighlights;
