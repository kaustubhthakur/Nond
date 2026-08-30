import { ApiError, ApiErrorBody } from "@/types/auth";
import {
  CreateShelfPayload,
  Shelf,
  ShelfOptions,
  UpdateShelfPayload,
} from "@/types/shelf";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";
const SHELF_URL = `${API_BASE_URL}/shelf`;

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = "GET", body } = options;

  let res: Response;

  try {
    res = await fetch(`${SHELF_URL}${path}`, {
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
  } catch {
    // no body / non-json response
  }

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

export const shelfApi = {
  getOptions: () => request<{ success: true } & ShelfOptions>("/options"),

  create: (
    storeId: string,
    warehouseId: string,
    payload: CreateShelfPayload
  ) =>
    request<{ success: true; message: string; shelf: Shelf }>(
      `/store/${storeId}/warehouse/${warehouseId}`,
      { method: "POST", body: payload }
    ),

  // Also the source of real "shelves filled" usage for a warehouse:
  // count / shelfCapacity / availableShelves come straight from Firestore.
  list: (storeId: string, warehouseId: string) =>
    request<{
      success: true;
      count: number;
      shelfCapacity: number;
      availableShelves: number;
      shelves: Shelf[];
    }>(`/store/${storeId}/warehouse/${warehouseId}`),

  get: (storeId: string, warehouseId: string, shelfId: string) =>
    request<{ success: true; shelf: Shelf }>(
      `/store/${storeId}/warehouse/${warehouseId}/${shelfId}`
    ),

  update: (
    storeId: string,
    warehouseId: string,
    shelfId: string,
    payload: UpdateShelfPayload
  ) =>
    request<{ success: true; message: string; shelf: Shelf }>(
      `/store/${storeId}/warehouse/${warehouseId}/${shelfId}`,
      { method: "PUT", body: payload }
    ),

  remove: (storeId: string, warehouseId: string, shelfId: string) =>
    request<{ success: true; message: string }>(
      `/store/${storeId}/warehouse/${warehouseId}/${shelfId}`,
      { method: "DELETE" }
    ),
};