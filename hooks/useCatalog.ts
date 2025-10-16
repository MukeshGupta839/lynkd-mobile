import { getProductDetail, Product, unwrapItem } from "@/services/catalog";
import { useCallback, useEffect, useState } from "react";

// Hook to fetch one product by its ID
export function useProductDetail(productId?: string | number) {
  const [data, setData] = useState<Product | null>(null);
  const [loading, setLoading] = useState(!!productId);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getProductDetail(productId);
      setData(unwrapItem(res) ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load product detail");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { data, loading, error, refresh: fetchDetail };
}
