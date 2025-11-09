// components/Productview/VariantOptions.tsx
import { Image as ExpoImage } from "expo-image";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/* ---------- types ---------- */
export type Variant = {
  color: string;
  images?: (string | { uri: string })[];
  swatch?: string | { uri: string };
};

export type StorageOption = { size: string; price: number };

type Props = {
  /* Color */
  variants?: Variant[];
  selectedColor?: string;
  onSelectColor?: (color: string) => void;
  isColorAvailable?: (color: string) => boolean;

  /* Size / Storage */
  storages?: StorageOption[];
  selectedStorage?: StorageOption;
  onSelectStorage?: (s: StorageOption) => void;
  getPriceFor?: (size: string) => number;
  getStockFor?: (size: string) => number;
  isStorageAvailable?: (size: string) => boolean;

  /* UI (optional for TS support) */
  singleColorPrice?: number;
  singleColorMrp?: number;
  promoLabel?: string;
  onPressSizeGuide?: () => void;
};

const money = (n = 0) =>
  Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

/* ---------- colors ---------- */
const COLORS = {
  blue: "#2563EB",
  blue200: "#BFDBFE",
  white: "#ffffffff",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  green600: "#16A34A",
  red600: "#DC2626",
};

const BORDER_W = 2;

export default function VariantOptions({
  variants = [],
  selectedColor = "",
  onSelectColor,
  isColorAvailable = () => true,

  storages = [],
  selectedStorage,
  onSelectStorage,
  getPriceFor = () => 0,
  getStockFor = () => 0,
  isStorageAvailable = () => true,

  singleColorPrice,
  singleColorMrp,
  promoLabel,
  onPressSizeGuide,
}: Props) {
  const { width } = Dimensions.get("window");

  const COLOR_W = Math.min(Math.max(Math.round(width * 0.36), 132), 210);
  const COLOR_H = 164;
  const SIZE_W = Math.min(Math.max(Math.round(width * 0.28), 100), 220);
  const SIZE_H = 100;

  const hasVariants = variants?.length > 0;
  const hasStorages = storages?.length > 0;

  return (
    <View>
      {/* ---------------- Colour ---------------- */}
      {hasVariants && (
        <View>
          <View
            style={{
              paddingHorizontal: 12,
              marginBottom: 16,
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={{ fontSize: 20, fontWeight: "800" }}>Colour: </Text>
              <Text style={{ fontSize: 18, fontWeight: "600" }}>
                {selectedColor || "-"}
              </Text>
            </View>
          </View>

          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12 }}>
            {variants.map((v, idx) => {
              const available = isColorAvailable(v.color);
              const active = selectedColor === v.color;
              const img = v.swatch ?? v.images?.[0];

              return (
                <TouchableOpacity
                  key={v.color ?? `color-${idx}`}
                  onPress={() => available && onSelectColor?.(v.color)}
                  disabled={!available}
                  activeOpacity={0.9}
                  accessibilityLabel={`Color ${v.color}`}
                  accessibilityRole="button"
                  style={{
                    width: COLOR_W,
                    height: COLOR_H,
                    opacity: available ? 1 : 0.5,
                    marginRight: idx === variants.length - 1 ? 0 : 12,
                    borderRadius: 16,
                    overflow: "hidden",
                    borderWidth: BORDER_W,
                    borderColor: active ? COLORS.blue : COLORS.gray300,
                    backgroundColor: COLORS.white,
                  }}>
                  {/* image area */}
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 8,
                      backgroundColor: COLORS.white,
                    }}>
                    {img ? (
                      <ExpoImage
                        source={img}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="contain"
                        contentPosition="center"
                        transition={120}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <Text style={{ color: "#6B7280" }}>No Image</Text>
                    )}
                  </View>

                  {/* divider */}
                  <View
                    style={{
                      height: StyleSheet.hairlineWidth,
                      backgroundColor: COLORS.gray200,
                      marginHorizontal: BORDER_W,
                    }}
                  />

                  {/* name strip */}
                  <View
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      backgroundColor: active ? COLORS.blue200 : COLORS.gray200,
                    }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        textAlign: "center",
                        color: "#111827",
                      }}>
                      {v.color}
                    </Text>
                  </View>

                  {/* out of stock */}
                  {!available && (
                    <View
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        right: 8,
                        alignItems: "center",
                      }}>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: "rgba(0,0,0,0.7)",
                        }}>
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: "700",
                          }}>
                          Out of stock
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </Animated.ScrollView>
        </View>
      )}

      {/* ---------------- Size / Storage ---------------- */}
      {hasStorages && (
        <View style={{ marginTop: 16 }}>
          <View
            style={{
              paddingHorizontal: 12,
              marginBottom: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={{ fontSize: 20, fontWeight: "800" }}>Size: </Text>
              <Text style={{ fontSize: 18, fontWeight: "600" }}>
                {selectedStorage?.size || "-"}
              </Text>
            </View>

            {onPressSizeGuide && (
              <TouchableOpacity
                onPress={onPressSizeGuide}
                activeOpacity={0.8}
                accessibilityLabel="Open size guide">
                <Text style={{ color: "#2563EB", fontWeight: "600" }}>
                  Size guide
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12 }}>
            {storages.map((s, idx) => {
              const available = isStorageAvailable(s.size);
              const active = selectedStorage?.size === s.size;
              const left = getStockFor(s.size);

              return (
                <TouchableOpacity
                  key={s.size}
                  onPress={() => available && onSelectStorage?.(s)}
                  disabled={!available}
                  activeOpacity={0.9}
                  accessibilityLabel={`Storage ${s.size}`}
                  accessibilityRole="button"
                  style={{
                    width: SIZE_W,
                    height: SIZE_H,
                    opacity: available ? 1 : 0.5,
                    marginRight: idx === storages.length - 1 ? 0 : 12,
                    borderRadius: 16,
                    overflow: "hidden",
                    borderWidth: BORDER_W,
                    borderColor: active ? COLORS.blue : COLORS.gray300,
                    backgroundColor: COLORS.white,
                  }}>
                  {/* header strip */}
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: active ? COLORS.blue200 : COLORS.gray200,
                    }}>
                    <Text style={{ fontSize: 18, fontWeight: "800" }}>
                      {s.size}
                    </Text>
                  </View>

                  {/* body */}
                  <View
                    style={{
                      flex: 1,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: COLORS.white,
                    }}>
                    <Text style={{ fontSize: 18, fontWeight: "800" }}>
                      ₹{money(getPriceFor(s.size))}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: available ? COLORS.green600 : COLORS.red600,
                      }}>
                      {available
                        ? left < 10
                          ? `Only ${left} left`
                          : "In stock"
                        : "Out of stock"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Animated.ScrollView>
        </View>
      )}
    </View>
  );
}
