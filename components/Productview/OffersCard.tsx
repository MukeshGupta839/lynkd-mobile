// components/Productview/OffersCard.tsx
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  LayoutAnimation,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

/* Enable LayoutAnimation on Android */
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ---------- Types ---------- */
export type BankOffer = {
  id: string;
  logo: number; // use require(...) so logos always show
  headline: string;
  details: string;
  tnc?: string[];
  meta?: string; // e.g., "Credit/Debit EMI"
  accent?: "blue" | "red" | "green" | "gray";
};

export type Coupon = {
  id: string;
  code: string;
  title: string; // chip text
  description?: string; // shown in the green card
  type?: "discount" | "cashback";
};

type Kind = "phone" | "facewash" | "clothing";

type Props = {
  /** Auto-pick default offers/coupons when none are passed */
  kind?: Kind;
  showBankOffers?: boolean;
  bankOffers?: BankOffer[];
  coupons?: Coupon[];
  onApplyCoupon?: (coupon: Coupon) => void;
  onApplyBankOffer?: (offer: BankOffer) => void;
};

/* ---------- Phone defaults (your original — UNCHANGED) ---------- */
const DEFAULT_BANK_OFFERS_PHONE: BankOffer[] = [
  {
    id: "hdfc",
    logo: require("../../assets/images/Product/hdfc.png"),
    headline: "10% Instant Discount",
    details: "on iPhone 16 + extra 10% cashback",
    tnc: [
      "Valid on HDFC Credit/Debit EMI",
      "Min. transaction ₹20,000",
      "Max discount ₹5,000",
    ],
    meta: "Credit/Debit EMI",
    accent: "blue",
  },
  {
    id: "kotak",
    logo: require("../../assets/images/Product/kotak.png"),
    headline: "10% Instant Discount",
    details: "on iPhone 16 with Kotak cards",
    tnc: ["Only on Credit EMI", "Offer period: month end"],
    meta: "Credit EMI",
    accent: "red",
  },
];

const DEFAULT_COUPONS_PHONE: Coupon[] = [
  {
    id: "c1",
    code: "FIRST15",
    title: "Extra 15% off",
    description: "Up to ₹5,000 on your first order",
    type: "discount",
  },
  {
    id: "c2",
    code: "IPHONE5000",
    title: "Get ₹5000 cashback",
    description: "Applicable on prepaid orders",
    type: "cashback",
  },
];

/* ---------- Facewash defaults ---------- */
const DEFAULT_BANK_OFFERS_FACEWASH: BankOffer[] = [
  {
    id: "hdfc_fw",
    logo: require("../../assets/images/Product/hdfc.png"),
    headline: "5% Instant Discount",
    details: "on Beauty & Personal Care orders",
    tnc: [
      "Valid on HDFC Credit/Debit cards",
      "Min. transaction ₹999",
      "Max discount ₹300",
    ],
    meta: "Cards Only",
    accent: "green",
  },
  {
    id: "kotak_fw",
    logo: require("../../assets/images/Product/kotak.png"),
    headline: "Extra 10% Cashback",
    details: "with Kotak Credit Card on prepaid",
    tnc: ["Cashback post statement", "Offer period: limited time"],
    meta: "Credit Card",
    accent: "blue",
  },
];

const DEFAULT_COUPONS_FACEWASH: Coupon[] = [
  {
    id: "fw1",
    code: "GLOW10",
    title: "10% off (Face Care)",
    description: "Valid on select face cleansers • Min. order ₹499",
    type: "discount",
  },
  {
    id: "fw2",
    code: "CLEANSE15",
    title: "15% off combo",
    description: "Buy 2+ get extra 15% off • Auto-applies at checkout",
    type: "discount",
  },
];

/* ---------- Clothing defaults ---------- */
const DEFAULT_BANK_OFFERS_CLOTHING: BankOffer[] = [
  {
    id: "hdfc_cl",
    logo: require("../../assets/images/Product/hdfc.png"),
    headline: "10% Instant Discount",
    details: "on Fashion & Apparel",
    tnc: [
      "Valid on HDFC Credit/Debit cards",
      "Min. transaction ₹1,499",
      "Max discount ₹400",
    ],
    meta: "Cards Only",
    accent: "blue",
  },
  {
    id: "kotak_cl",
    logo: require("../../assets/images/Product/kotak.png"),
    headline: "Flat ₹250 cashback",
    details: "on apparel orders above ₹1,999",
    tnc: ["Kotak Credit Card only", "Cashback within 90 days"],
    meta: "Credit Card",
    accent: "red",
  },
];

const DEFAULT_COUPONS_CLOTHING: Coupon[] = [
  {
    id: "cl1",
    code: "STYLE200",
    title: "₹200 off",
    description: "On orders ₹1,499+ • Applicable sitewide fashion",
    type: "discount",
  },
  {
    id: "cl2",
    code: "FRESHFIT15",
    title: "15% off (New)",
    description: "New user offer on apparel • First order only",
    type: "discount",
  },
];

/* ---------- Kind maps ---------- */
const BANK_OFFERS_BY_KIND: Record<Kind, BankOffer[]> = {
  phone: DEFAULT_BANK_OFFERS_PHONE,
  facewash: DEFAULT_BANK_OFFERS_FACEWASH,
  clothing: DEFAULT_BANK_OFFERS_CLOTHING,
};

const COUPONS_BY_KIND: Record<Kind, Coupon[]> = {
  phone: DEFAULT_COUPONS_PHONE,
  facewash: DEFAULT_COUPONS_FACEWASH,
  clothing: DEFAULT_COUPONS_CLOTHING,
};

/* ---------- Accent helpers ---------- */
const borderByAccent = {
  blue: "border-blue-500",
  red: "border-red-500",
  green: "border-emerald-500",
  gray: "border-gray-300",
} as const;

const linkByAccent = {
  blue: "text-blue-600",
  red: "text-red-600",
  green: "text-emerald-700",
  gray: "text-gray-700",
} as const;

const ctaBgByAccent = {
  blue: "bg-blue-600",
  red: "bg-red-600",
  green: "bg-emerald-600",
  gray: "bg-gray-700",
} as const;

/* =======================================================
   OffersCard
   ======================================================= */
export default function OffersCard({
  kind = "phone",
  showBankOffers = true,
  bankOffers,
  coupons,
  onApplyCoupon,
  onApplyBankOffer,
}: Props) {
  // Resolve defaults by kind if props not supplied
  const resolvedBankOffers = bankOffers ?? BANK_OFFERS_BY_KIND[kind] ?? [];
  const resolvedCoupons = coupons ?? COUPONS_BY_KIND[kind] ?? [];

  const [expandedBankId, setExpandedBankId] = useState<string | null>(null);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(
    resolvedCoupons[0]?.id ?? null
  );
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);

  const selectedCoupon = useMemo(
    () => resolvedCoupons.find((c) => c.id === selectedCouponId) || null,
    [resolvedCoupons, selectedCouponId]
  );

  const toggleBank = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedBankId((prev) => (prev === id ? null : id));
  };

  const applyBank = (offer: BankOffer) => {
    onApplyBankOffer?.(offer);
    Alert.alert("Bank offer selected", offer.headline);
  };

  const applyCoupon = () => {
    if (!selectedCoupon) return;
    setAppliedCouponId(selectedCoupon.id);
    onApplyCoupon?.(selectedCoupon);
    Alert.alert("Coupon applied", `${selectedCoupon.code} has been applied`);
  };

  const removeCoupon = () => setAppliedCouponId(null);

  /* -------------------- UI -------------------- */
  return (
    <View className="w-full bg-white">
      {/* Header */}
      <View className="flex-row px-3 py-2 items-center ">
        <Ionicons name="gift-outline" size={18} color="#111827" />
        <Text className="ml-2  text-base font-semibold text-gray-900">
          Offers
        </Text>
      </View>

      {/* ============== Bank Offers ============== */}
      {showBankOffers && resolvedBankOffers.length > 0 && (
        <View className="mt-3">
          <View className="flex-row items-center mb-2 px-3">
            <Ionicons name="card-outline" size={16} color="#111827" />
            <Text className="ml-2 text-sm font-medium text-gray-900">
              Bank Offers
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12 }}>
            {resolvedBankOffers.map((o) => {
              const open = expandedBankId === o.id;
              const border = borderByAccent[o.accent ?? "gray"];
              const link = linkByAccent[o.accent ?? "gray"];
              const ctaBg = ctaBgByAccent[o.accent ?? "gray"];

              return (
                <View key={o.id} className="mr-3 ">
                  {/* Card (fixed height so all equal) */}
                  <TouchableOpacity
                    activeOpacity={0.92}
                    onPress={() => toggleBank(o.id)}
                    className={`w-64 h-36 rounded-2xl border ${border} bg-white px-3 py-2`}>
                    <View className="h-full">
                      {/* Row 1: logo + meta pill */}
                      <View className="flex-row items-center">
                        <Image
                          source={o.logo}
                          className="h-6 w-28"
                          resizeMode="contain"
                        />
                        {o.meta ? (
                          <View className="ml-auto  py-0.5 rounded-full bg-gray-100">
                            <Text className="text-xs font-semibold text-gray-700">
                              {o.meta}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Row 2: content */}
                      <View className="flex-1 justify-center">
                        <Text
                          className="text-sm font-semibold text-gray-900"
                          numberOfLines={1}>
                          {o.headline}
                        </Text>
                        <Text
                          className="text-sm text-gray-600 "
                          numberOfLines={1}>
                          {o.details}
                        </Text>
                      </View>

                      {/* Row 3: link */}
                      <View className="flex-row items-center">
                        <Text className={`text-sm font-semibold ${link}`}>
                          View details
                        </Text>
                        <Ionicons
                          name={open ? "chevron-up" : "chevron-down"}
                          size={16}
                          color={
                            link.includes("blue")
                              ? "#2563EB"
                              : link.includes("red")
                                ? "#DC2626"
                                : link.includes("emerald")
                                  ? "#059669"
                                  : "#374151"
                          }
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded terms */}
                  {open && (
                    <View
                      className={`mt-2 w-64 rounded-xl border ${border} bg-gray-50 px-3 py-2`}>
                      {(o.tnc ?? []).map((t, i) => (
                        <View key={i} className="flex-row items-start mb-1">
                          <Text className="mr-2 text-lg leading-5">•</Text>
                          <Text className="flex-1 text-sm leading-5 text-gray-700">
                            {t}
                          </Text>
                        </View>
                      ))}
                      <View className="flex-row justify-between items-center mt-2">
                        <TouchableOpacity
                          onPress={() => applyBank(o)}
                          className={`rounded-lg px-3 py-2 ${ctaBg}`}
                          activeOpacity={0.9}>
                          <Text className="text-white font-semibold text-sm">
                            Apply
                          </Text>
                        </TouchableOpacity>
                        <Text className="text-sm text-gray-500">T&C apply</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ============== Coupon Offers ============== */}
      <View className="mt-4  px-3 mb-2">
        <View className="flex-row items-center mb-2">
          <Ionicons name="pricetag-outline" size={16} color="#111827" />
          <Text className="ml-2 text-sm font-medium text-gray-900">
            Coupon Offers
          </Text>
        </View>

        {/* Chips rail — NO GAP between icon & text */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 8 }}>
          {resolvedCoupons.map((c) => {
            const active = selectedCouponId === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedCouponId(c.id)}
                activeOpacity={0.9}
                className={`mr-2 rounded-2xl px-3 py-2 border flex-row items-center ${
                  active
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-300 bg-white"
                }`}>
                {/* icon with zero text gap */}
                <Ionicons
                  name={
                    c.type === "cashback" ? "cash-outline" : "pricetag-outline"
                  }
                  size={12}
                  color={active ? "#059669" : "#4B5563"}
                />
                <Text
                  className={`ml-1 text-sm ${
                    active ? "text-emerald-700 font-semibold" : "text-gray-800"
                  }`}>
                  {c.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected coupon card */}
        {selectedCoupon && (
          <View
            className={`mt-3 rounded-xl border p-3 ${
              appliedCouponId === selectedCoupon.id
                ? "bg-emerald-50 border-emerald-300"
                : "bg-emerald-50 border-emerald-200"
            }`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons
                  name={
                    selectedCoupon.type === "cashback"
                      ? "cash-outline"
                      : "pricetag-outline"
                  }
                  size={16}
                  color="#059669"
                />
                <Text className="ml-2 text-sm font-semibold text-emerald-800">
                  {selectedCoupon.title}
                </Text>
              </View>

              {appliedCouponId === selectedCoupon.id && (
                <View className="flex-row items-center px-2 py-0.5 rounded-full bg-emerald-600">
                  <Ionicons name="checkmark" size={12} color="white" />
                  <Text className="ml-1 text-white text-xs font-semibold">
                    Applied
                  </Text>
                </View>
              )}
            </View>

            {!!selectedCoupon.description && (
              <Text className="text-[12px] text-emerald-700 mt-1">
                {selectedCoupon.description}
              </Text>
            )}

            <View className="mt-3 flex-row items-center justify-between">
              <View className="border border-emerald-500 rounded-md px-3 py-1.5 border-dashed bg-white">
                <Text className="text-emerald-700 font-semibold">
                  {selectedCoupon.code}
                </Text>
              </View>

              {appliedCouponId === selectedCoupon.id ? (
                <TouchableOpacity
                  onPress={() =>
                    appliedCouponId ? setAppliedCouponId(null) : null
                  }
                  className="px-5 py-2 rounded-lg bg-gray-200"
                  activeOpacity={0.9}>
                  <Text className="text-gray-900 font-semibold">Remove</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={applyCoupon}
                  className="px-5 py-2 rounded-lg bg-emerald-600"
                  activeOpacity={0.9}>
                  <Text className="text-white font-semibold">Apply</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
