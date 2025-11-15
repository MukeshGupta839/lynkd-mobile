// components/Productview/ReviewsCard.tsx
import type { Review, ReviewsSummary } from "@/constants/review";
import { FontAwesome5 } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import Octicons from "@expo/vector-icons/Octicons";
import { Image as ExpoImage } from "expo-image"; // ⬅️ use ExpoImage for fit control
import { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type Filter = "all" | "photos" | "verified";

type Props = {
  kind?: "phone" | "facewash" | "clothing" | "service";
  title?: string;
  summary: ReviewsSummary;
  reviews: Review[];
  showAll?: boolean;
  onViewMore?: () => void;
  showAvatar?: boolean;
  showPhotos?: boolean;
};

/* ---------- helpers: image fit ---------- */
const getUri = (src: any): string => {
  if (!src) return "";
  if (typeof src === "string") return src;
  return (src?.uri as string) ?? "";
};
const isTransparentAsset = (src: any) =>
  getUri(src).toLowerCase().endsWith(".png");

/* ---------- Stars row ---------- */
function StarsRow({ value, size = 16 }: { value: number; size?: number }) {
  const whole = Math.floor(value);
  const remainder = value - whole;
  const hasHalf = remainder >= 0.25 && remainder < 0.75;
  const empty = 5 - whole - (hasHalf ? 1 : 0);

  return (
    <View className="flex-row items-center">
      {[...Array(whole)].map((_, i) => (
        <FontAwesome5
          key={`f-${i}`}
          name="star"
          size={size}
          color="#F59E0B"
          solid
          style={{ marginRight: 2 }}
        />
      ))}
      {hasHalf && (
        <FontAwesome5
          name="star-half-alt"
          size={size}
          color="#F59E0B"
          solid
          style={{ marginRight: 2 }}
        />
      )}
      {[...Array(empty)].map((_, i) => (
        <FontAwesome5
          key={`e-${i}`}
          name="star"
          size={size}
          color="#E5E7EB"
          solid
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
}

/* ---------- Distribution bar ---------- */
function DistBar({ pct, label }: { pct: number; label: string }) {
  const w = Math.max(6, Math.min(100, Math.round(pct)));
  return (
    <View className="flex-row items-center mb-1.5">
      <Text className="w-9 text-xs text-gray-600">{label}</Text>
      <View className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <View
          style={{ width: `${w}%` }}
          className="h-2 rounded-full bg-emerald-500"
        />
      </View>
      <Text className="ml-2 w-10 text-right text-[11px] text-gray-600">
        {w}%
      </Text>
    </View>
  );
}

/* ---------- Main ---------- */
export default function ReviewsCard({
  kind = "phone",
  title = "Ratings & Reviews",
  summary,
  reviews,
  showAll = false,
  onViewMore,
  showAvatar = true,
  showPhotos = true,
}: Props) {
  const dist = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const k = Math.max(1, Math.min(5, Math.round(r.rating)));
      counts[k] = (counts[k] || 0) + 1;
    });
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((s) => ((counts[s] ?? 0) / total) * 100);
  }, [reviews]);

  const [filter, setFilter] = useState<Filter>("all");

  // Helpful states: 'idle' | 'sending' | 'done'
  const [helpfulState, setHelpfulState] = useState<
    Record<string, "idle" | "sending" | "done">
  >({});
  // Report states: 'idle' | 'done'
  const [reportedState, setReportedState] = useState<
    Record<string, "idle" | "done">
  >({});

  // Report modal state
  const [reportOpenFor, setReportOpenFor] = useState<string | null>(null);
  const [reportReasons, setReportReasons] = useState<Record<string, boolean>>({
    offTopic: false,
    inappropriate: false,
    fake: false,
    other: false,
  });

  const filtered = useMemo(() => {
    switch (filter) {
      case "photos":
        return reviews.filter((r) => (r.photos?.length ?? 0) > 0);
      case "verified":
        return reviews.filter((r) => r.verified);
      default:
        return reviews;
    }
  }, [reviews, filter]);

  const visible = showAll ? filtered : filtered.slice(0, 2);

  const startHelpful = (id: string) => {
    if (helpfulState[id] === "done" || helpfulState[id] === "sending") return;
    setHelpfulState((p) => ({ ...p, [id]: "sending" }));
    setTimeout(() => {
      setHelpfulState((p) => ({ ...p, [id]: "done" }));
    }, 900);
  };

  const openReport = (id: string) => {
    setReportOpenFor(id);
    setReportReasons({
      offTopic: false,
      inappropriate: false,
      fake: false,
      other: false,
    });
  };

  const closeReport = () => {
    setReportOpenFor(null);
    setReportReasons({
      offTopic: false,
      inappropriate: false,
      fake: false,
      other: false,
    });
  };

  const submitReport = () => {
    const anySelected = Object.values(reportReasons).some(Boolean);
    if (!anySelected) return;
    const id = reportOpenFor!;
    closeReport();
    setTimeout(() => {
      setReportedState((p) => ({ ...p, [id]: "done" }));
    }, 250);
  };

  const toggleReason = (key: keyof typeof reportReasons) => {
    setReportReasons((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View className="w-full bg-white border border-gray-100 px-3 py-5">
      <Text className="text-lg font-semibold">{title}</Text>

      {/* Score & distribution */}
      <View className="mt-3">
        <View className="flex-row">
          <View className="w-28 mr-4">
            <Text className="text-4xl font-semibold text-gray-900">
              {summary.average.toFixed(1)}
            </Text>
            <View className="mt-1">
              <StarsRow value={summary.average} size={18} />
            </View>
            <Text className="mt-1 text-xs text-gray-500">
              {summary.basedOnText}
            </Text>
          </View>
          <View className="flex-1">
            <DistBar pct={dist[0]} label="5 ★" />
            <DistBar pct={dist[1]} label="4 ★" />
            <DistBar pct={dist[2]} label="3 ★" />
            <DistBar pct={dist[3]} label="2 ★" />
            <DistBar pct={dist[4]} label="1 ★" />
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ paddingRight: 4 }}
        >
          {(
            [
              { id: "all", label: "All" },
              { id: "photos", label: "With photos" },
              { id: "verified", label: "Verified" },
            ] as { id: Filter; label: string }[]
          ).map((f) => {
            const active = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.85}
                className={`mr-2 rounded-full px-3 py-1.5 border ${
                  active
                    ? "bg-emerald-50 border-emerald-500"
                    : "bg-white border-gray-300"
                }`}
              >
                <Text
                  className={`text-xs ${
                    active ? "text-emerald-700 font-semibold" : "text-gray-700"
                  }`}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Reviews */}
      <View className="mt-3">
        {visible.map((r, idx) => {
          const helpful = helpfulState[r.id] ?? "idle";
          const reported = reportedState[r.id] === "done";

          return (
            <View
              key={r.id}
              className={`py-4 ${idx !== visible.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              {/* Header row */}
              <View className="flex-row">
                {showAvatar && (
                  <View className="h-9 w-9 rounded-full overflow-hidden mr-3 bg-white ring-1 ring-gray-200">
                    {r.avatar ? (
                      <ExpoImage
                        source={r.avatar}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                        transition={120}
                      />
                    ) : null}
                  </View>
                )}
                <View className="flex-1">
                  <View className="flex-row items-center flex-wrap">
                    <Text className="text-sm font-semibold text-gray-900">
                      {r.name}
                    </Text>
                    {r.verified && (
                      <View className="ml-2 flex-row items-center">
                        <Octicons name="verified" size={14} color="#000000ff" />
                      </View>
                    )}
                  </View>
                  <View className="mt-1 flex-row items-center">
                    <StarsRow value={r.rating} size={13} />
                    <Text className="ml-2 text-[11px] text-gray-500">
                      {r.rating.toFixed(1)}
                    </Text>
                  </View>
                  <Text className="text-[11px] text-gray-500 mt-1">
                    Reviewed in India · Size: L | Colour: Black
                  </Text>
                </View>
              </View>

              {/* Body */}
              {!!r.text && (
                <Text className="mt-3 text-sm leading-5 text-gray-800">
                  {r.text}
                </Text>
              )}

              {/* Photos (framed white tiles; smart fit) */}
              {showPhotos && !!r.photos?.length && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mt-3"
                  contentContainerStyle={{ paddingRight: 6 }}
                >
                  {r.photos.slice(0, 6).map((img, i) => {
                    const transparent = isTransparentAsset(img);
                    return (
                      <View
                        key={`${r.id}-p-${i}`}
                        className="mr-3 h-24 w-24 rounded-xl overflow-hidden bg-white ring-1 ring-gray-200"
                      >
                        <ExpoImage
                          source={img}
                          style={{ width: "100%", height: "100%" }}
                          contentFit={transparent ? "contain" : "cover"}
                          contentPosition="center"
                          transition={120}
                        />
                      </View>
                    );
                  })}
                </ScrollView>
              )}

              {/* Report success note */}
              {reported && (
                <View className="mt-3">
                  <Text className="text-[13px] text-emerald-700">
                    Thank you. We’ll investigate in the next few days.
                  </Text>
                </View>
              )}

              {/* Actions line */}
              {(helpful !== "done" || !reported) && (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                  className="mt-3"
                >
                  {helpful === "idle" ? (
                    <>
                      <TouchableOpacity
                        onPress={() => startHelpful(r.id)}
                        activeOpacity={0.9}
                        className="px-3 py-1.5 mr-2 rounded-full border border-gray-300 bg-white"
                      >
                        <Text className="text-sm text-gray-800">Helpful</Text>
                      </TouchableOpacity>

                      {!reported && (
                        <TouchableOpacity
                          onPress={() => openReport(r.id)}
                          activeOpacity={0.9}
                          className="px-3 py-1.5 rounded-full border border-gray-300 bg-white"
                        >
                          <Text className="text-sm text-gray-800">Report</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Ionicons
                          name={
                            helpful === "sending"
                              ? "time-outline"
                              : "checkmark-circle"
                          }
                          size={16}
                          color={helpful === "sending" ? "#111827" : "#059669"}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          className={
                            helpful === "sending"
                              ? "text-[13px] text-black"
                              : "text-[13px] text-emerald-700"
                          }
                          style={{ marginRight: 8 }}
                        >
                          {helpful === "sending"
                            ? "Sending feedback…"
                            : "Thank you for your feedback."}
                        </Text>
                      </View>

                      {!reported && (
                        <TouchableOpacity
                          onPress={() => openReport(r.id)}
                          activeOpacity={0.9}
                          className="px-3 py-1.5 rounded-full border border-gray-300 bg-white"
                          style={{ marginTop: 4 }}
                        >
                          <Text className="text-sm text-gray-800">Report</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {!showAll && filtered.length > visible.length && (
        <TouchableOpacity
          onPress={onViewMore}
          activeOpacity={0.9}
          className="mt-4 w-full rounded-xl bg-gray-50 border border-gray-200 py-3 items-center"
        >
          <Text className="text-sm font-medium text-gray-800">
            View more reviews
          </Text>
        </TouchableOpacity>
      )}

      {/* Report Modal */}
      <Modal
        visible={!!reportOpenFor}
        transparent
        animationType="fade"
        onRequestClose={closeReport}
      >
        <View className="flex-1 justify-end">
          <TouchableWithoutFeedback onPress={closeReport}>
            <View className="flex-1 bg-black/40" />
          </TouchableWithoutFeedback>

          <View className="bg-white rounded-t-3xl px-4 pt-0">
            <View className="flex-row items-center justify-between mb-2 mt-3">
              <Text className="text-lg font-semibold">Report this review</Text>
              <TouchableOpacity
                onPress={closeReport}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>

            <Text className="text-[13px] text-gray-600 mb-3">
              Optional: Why are you reporting this?
            </Text>

            {[
              {
                key: "offTopic",
                title: "Off topic",
                sub: "Not about the product",
              },
              {
                key: "inappropriate",
                title: "Inappropriate",
                sub: "Disrespectful, hateful, obscene",
              },
              { key: "fake", title: "Fake", sub: "Paid for, inauthentic" },
              { key: "other", title: "Other", sub: "Something else" },
            ].map((opt) => {
              const selected =
                reportReasons[opt.key as keyof typeof reportReasons];
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => {
                    const k = opt.key as keyof typeof reportReasons;
                    setReportReasons((prev) => ({ ...prev, [k]: !prev[k] }));
                  }}
                  activeOpacity={0.8}
                  className="flex-row items-start py-3"
                >
                  <View
                    className={`h-5 w-5 rounded-md border ${
                      selected
                        ? "bg-black border-black"
                        : "bg-white border-gray-400"
                    } mr-3`}
                  >
                    {selected ? (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : null}
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] text-gray-900">
                      {opt.title}
                    </Text>
                    <Text className="text-[12px] text-gray-500">{opt.sub}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <Text className="text-[12px] text-gray-500 mt-1">
              We’ll check if this review meets our community guidelines. If it
              doesn’t, we’ll remove it.
            </Text>

            <View className="mt-5 pb-6">
              <TouchableOpacity
                onPress={submitReport}
                disabled={!Object.values(reportReasons).some(Boolean)}
                activeOpacity={0.9}
                className={`w-full rounded-full items-center ${
                  Object.values(reportReasons).some(Boolean)
                    ? "bg-black"
                    : "bg-gray-300"
                } py-4`}
              >
                <Text className="text-white text-base font-semibold">
                  Submit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
