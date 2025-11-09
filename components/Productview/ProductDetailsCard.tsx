// components/Productview/ProductDetailsCard.tsx
import { Text, View } from "react-native";

type KV = { label: string; value: any };
type Details = Record<string, any> | (KV | [string, any])[];

function normalize(details?: Details): KV[] {
  if (!details) return [];
  if (Array.isArray(details)) {
    return details.map((row) => {
      if (Array.isArray(row)) return { label: String(row[0]), value: row[1] };
      return { label: String(row.label), value: row.value };
    });
  }
  return Object.entries(details).map(([k, v]) => ({ label: k, value: v }));
}

export default function ProductDetailsCard({ details }: { details?: Details }) {
  const rows = normalize(details).filter(
    (r) => r.label && r.value != null && r.value !== ""
  );
  if (rows.length === 0) return null;

  return (
    <View className="bg-white rounded-xl px-3 py-3">
      <Text className="text-base font-semibold mb-2">Product Details</Text>
      {rows.map((r, idx) => (
        <View
          key={`${r.label}-${idx}`}
          className="flex-row items-start justify-between py-2"
          style={{
            borderBottomWidth: idx < rows.length - 1 ? 1 : 0,
            borderBottomColor: "#EFEFEF",
          }}>
          <Text className="text-gray-500 mr-4" style={{ minWidth: 120 }}>
            {r.label}
          </Text>
          <Text className="text-gray-900 font-medium flex-1" numberOfLines={3}>
            {String(r.value)}
          </Text>
        </View>
      ))}
    </View>
  );
}
