// components/Productview/FeaturesCard.tsx
import {
  AirVent,
  Car,
  CheckCircle,
  DoorClosed,
  Droplet,
  Package,
  RefreshCw,
  Shirt,
  Star,
  Truck,
  Utensils,
  Wallet,
} from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

/* ---------------- Types ---------------- */
export type FeatureItem = {
  icon?: React.ReactNode;
  label: string; // can contain \n
  sublabel?: string; // single line
};

type Kind = "phone" | "facewash" | "clothing" | "service";

type Props = {
  kind?: Kind;
  source?: "product" | "service";
  features?: FeatureItem[];
  onPressFeature?: (index: number) => void;
};

/* ---------------- Defaults ---------------- */
const phoneDefaults: FeatureItem[] = [
  { icon: <Truck size={22} color="black" />, label: "Fast\nDelivery" },
  { icon: <Star size={22} color="black" />, label: "Top\nRated Seller" },
  { icon: <RefreshCw size={22} color="black" />, label: "Low\nReturns" },
  { icon: <Wallet size={22} color="black" />, label: "Cash On\nDelivery" },
];

const facewashDefaults: FeatureItem[] = [
  { icon: <Droplet size={22} color="black" />, label: "Dermatologist\nTested" },
  { icon: <CheckCircle size={22} color="black" />, label: "Safe\nIngredients" },
  { icon: <Package size={22} color="black" />, label: "Secure\nPackaging" },
  { icon: <Truck size={22} color="black" />, label: "Quick\nDelivery" },
];

const clothingDefaults: FeatureItem[] = [
  { icon: <Shirt size={22} color="black" />, label: "Premium\nFabric" },
  { icon: <Star size={22} color="black" />, label: "Top\nSeller" },
  { icon: <RefreshCw size={22} color="black" />, label: "Easy\nExchange" },
  { icon: <Wallet size={22} color="black" />, label: "COD\nAvailable" },
];

const serviceDefaults: FeatureItem[] = [
  { icon: <Car size={22} color="white" />, label: "Car\nParking" },
  { icon: <AirVent size={22} color="white" />, label: "AC /\nNon-AC" },
  { icon: <DoorClosed size={22} color="white" />, label: "Private\nCabins" },
  { icon: <Utensils size={22} color="white" />, label: "Waiter\nService" },
];

const productDefaults: FeatureItem[] = [
  { icon: <Truck size={22} color="black" />, label: "Delivery\nby LYNKD" },
  { icon: <Star size={22} color="black" />, label: "High Rated\nSeller" },
  { icon: <RefreshCw size={22} color="black" />, label: "Low\nReturns" },
  { icon: <Wallet size={22} color="black" />, label: "Cash On\nDelivery" },
];

const FEATURE_SETS: Record<Kind, FeatureItem[]> = {
  phone: phoneDefaults,
  facewash: facewashDefaults,
  clothing: clothingDefaults,
  service: serviceDefaults,
};

/* ----------- CONSTANT HEIGHTS (prevents jump) ----------- */
const ICON_SIZE = 48; // 12 * 4
const LABEL_LINE_HEIGHT = 16; // matches tailwind leading-4
const LABEL_LINES = 2; // reserve 2 lines
const LABEL_BLOCK_H = LABEL_LINE_HEIGHT * LABEL_LINES; // 32
const SUBLABEL_LINE_HEIGHT = 14; // compact sublabel
const SUBLABEL_BLOCK_H = SUBLABEL_LINE_HEIGHT; // reserve 1 line
const TILE_GAP = 8; // spacing between icon/label/sublabel

export default function FeaturesCard({
  kind = "phone",
  source = "product",
  features,
  onPressFeature,
}: Props) {
  const items =
    features ??
    FEATURE_SETS[kind] ??
    (source === "service" ? serviceDefaults : productDefaults);

  const circleClass = source === "service" ? "bg-indigo-600" : "bg-emerald-100";
  const circleRing =
    source === "service" ? "ring-indigo-500/40" : "ring-emerald-300";

  return (
    <View
      className="w-full bg-white border border-gray-100 shadow-sm"
      collapsable={false}>
      {/* Row of 4 tiles */}
      <View className="flex-row items-start px-3 py-5" style={{ columnGap: 8 }}>
        {items.map((f, idx) => {
          const Tile = (
            <View
              className="items-center justify-start flex-1"
              collapsable={false}>
              {/* Icon circle (fixed size) */}
              <View
                className={`rounded-full items-center justify-center ring ${circleRing} shadow-xs`}
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  backgroundColor: undefined,
                }}>
                <View
                  className={`${circleClass} rounded-full items-center justify-center`}
                  style={{ width: ICON_SIZE, height: ICON_SIZE }}>
                  {f.icon}
                </View>
              </View>

              {/* spacing */}
              <View style={{ height: TILE_GAP }} />

              {/* Label (reserve exactly 2 lines) */}
              <View
                style={{
                  height: LABEL_BLOCK_H,
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                <Text
                  className="text-xs text-center text-gray-800"
                  numberOfLines={LABEL_LINES}
                  allowFontScaling={false}
                  // Android: avoid extra top/bottom font padding that causes reflow
                  style={{ lineHeight: LABEL_LINE_HEIGHT }}>
                  {f.label}
                </Text>
              </View>

              {/* spacing */}
              {!!f.sublabel && <View style={{ height: TILE_GAP / 2 }} />}

              {/* Sublabel (always reserve 1 line; hide if not present) */}
              <View
                style={{
                  height: SUBLABEL_BLOCK_H,
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: f.sublabel ? 1 : 0,
                }}>
                <Text
                  className="text-xs text-center text-gray-500"
                  numberOfLines={1}
                  allowFontScaling={false}
                  style={{ lineHeight: SUBLABEL_LINE_HEIGHT }}>
                  {f.sublabel ?? " "}
                </Text>
              </View>
            </View>
          );

          return onPressFeature ? (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              onPress={() => onPressFeature(idx)}
              className="flex-1">
              {Tile}
            </TouchableOpacity>
          ) : (
            <View key={idx} className="flex-1">
              {Tile}
            </View>
          );
        })}
      </View>

      {/* Divider */}
      <View className="h-px bg-gray-100 mx-3" />

      {/* Footer text */}
      <View className="px-3 py-3">
        <Text className="text-xs text-gray-500">
          Guaranteed genuine • Secure packaging • Easy returns
        </Text>
      </View>
    </View>
  );
}
