import { ApiError, ApiErrorBody } from "@/types/auth";
import {
  CreateWarehousePayload,
  UpdateWarehousePayload,
  Warehouse,
  WarehouseOptions,
} from "@/types/warehouse";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";
const WAREHOUSE_URL = `${API_BASE_URL}/warehouse`;

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = "GET", body } = options;

  let res: Response;

  try {
    res = await fetch(`${WAREHOUSE_URL}${path}`, {
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

export const warehouseApi = {
  getOptions: () =>
    request<{ success: true } & WarehouseOptions>("/options"),

  create: (payload: CreateWarehousePayload) =>
    request<{ success: true; message: string; warehouse: Warehouse }>("/", {
      method: "POST",
      body: payload,
    }),

  list: (storeId: string) =>
    request<{ success: true; count: number; warehouses: Warehouse[] }>(
      `/store/${storeId}`
    ),

  get: (storeId: string, warehouseId: string) =>
    request<{ success: true; warehouse: Warehouse }>(
      `/store/${storeId}/${warehouseId}`
    ),

  update: (
    storeId: string,
    warehouseId: string,
    payload: UpdateWarehousePayload
  ) =>
    request<{ success: true; message: string; warehouse: Warehouse }>(
      `/store/${storeId}/${warehouseId}`,
      { method: "PUT", body: payload }
    ),

  remove: (storeId: string, warehouseId: string) =>
    request<{ success: true; message: string }>(
      `/store/${storeId}/${warehouseId}`,
      { method: "DELETE" }
    ),
};