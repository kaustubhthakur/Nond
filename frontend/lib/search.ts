import { apiFetch } from "./api";
import type { SearchProductsResponse } from "@/types/search";

export async function searchProducts(storeId: string, query: string) {
  return apiFetch<SearchProductsResponse>(
    `/search/store/${storeId}/search?q=${encodeURIComponent(query)}`
  );
}