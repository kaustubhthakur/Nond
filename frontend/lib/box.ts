import type { Box, BoxProduct, GetBoxesResponse, GetBoxProductsResponse } from "@/types/box";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error ?? "Something went wrong. Please try again.");
  }

  return data as T;
}

interface BoxResponse {
  success: boolean;
  message?: string;
  box: Box;
}

function basePath(storeId: string, warehouseId: string, shelfId: string, subShelfId: string) {
  return `/box/store/${storeId}/warehouse/${warehouseId}/shelf/${shelfId}/sub-shelf/${subShelfId}`;
}

export function getBoxes(storeId: string, warehouseId: string, shelfId: string, subShelfId: string) {
  return request<GetBoxesResponse>(basePath(storeId, warehouseId, shelfId, subShelfId));
}

export function createBox(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string,
  payload: { name: string; description?: string }
) {
  return request<BoxResponse>(basePath(storeId, warehouseId, shelfId, subShelfId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteBox(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string,
  boxId: string
) {
  return request<{ success: boolean; message: string }>(
    `${basePath(storeId, warehouseId, shelfId, subShelfId)}/${boxId}`,
    { method: "DELETE" }
  );
}

export function addProductToBox(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string,
  boxId: string,
  payload: { name: string; sku?: string; quantity: number }
) {
  return request<{ success: boolean; message: string; product: BoxProduct }>(
    `${basePath(storeId, warehouseId, shelfId, subShelfId)}/${boxId}/products`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export function getBoxProducts(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string,
  boxId: string
) {
  return request<GetBoxProductsResponse>(
    `${basePath(storeId, warehouseId, shelfId, subShelfId)}/${boxId}/products`
  );
}