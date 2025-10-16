import { apiCall } from "@/lib/api/apiService";

// --- Types (for product detail) ---
export type Product = {
  id: string | number;
  name: string;
  description?: string;
  main_image?: string;
  regular_price?: number;
  sale_price?: number;
  rating?: number;
  brandId?: string | number;
  categoryId?: string | number;
};

// --- Service: Get Product by ID ---
export const getProductDetail = async (productId: string | number) => {
  const res = await apiCall(`/api/products/product/${productId}`, "GET");
  if (__DEV__) console.log("📦 Product Detail Response", res);
  return res as Promise<Product | { data: Product }>;
};

// --- Helpers ---
export function unwrapItem<T>(
  input: T | { data: T } | undefined | null
): T | undefined {
  if (!input) return undefined as any;
  return (input as any).data ?? (input as any);
}
