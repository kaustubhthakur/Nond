import { ApiError, ApiErrorBody } from "@/types/auth";
import type { TopSellingSlice } from "@/types/dashboardStats";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";
const STATS_URL = `${API_BASE_URL}/stats`;

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = "GET", body } = options;

  let res: Response;

  try {
    res = await fetch(`${STATS_URL}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      0
    );
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    const errBody = (data ?? {}) as Partial<ApiErrorBody>;
    throw new ApiError(
      errBody.error ?? `Request failed (${res.status})`,
      res.status,
      errBody.retryAfter
    );
  }

  return data as T;
}

export const statsApi = {
  getTopSelling: (storeId: string) =>
    request<{
      success: true;
      slices: TopSellingSlice[];
    }>(`/store/${storeId}/top-selling`),
};

export const getTopSellingDevices = statsApi.getTopSelling;