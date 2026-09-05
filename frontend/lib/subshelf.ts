import type {
  GetSubShelfProductsResponse,
  GetSubShelvesResponse,
  SubShelf,
  SubShelfProduct,
} from "@/types/subshelf";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

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

interface SubShelfResponse {
  success: boolean;
  message?: string;
  subShelf: SubShelf;
}

export function getSubShelves(
  storeId: string,
  warehouseId: string,
  shelfId: string
) {
  return request<GetSubShelvesResponse>(
    `/subshelf/store/${storeId}/warehouse/${warehouseId}/shelf/${shelfId}`
  );
}

export function getSubShelf(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string
) {
  return request<SubShelfResponse>(
    `/subshelf/store/${storeId}/warehouse/${warehouseId}/shelf/${shelfId}/${subShelfId}`
  );
}

export function createSubShelf(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  payload: { name: string; description?: string }
) {
  return request<SubShelfResponse>(
    `/subshelf/store/${storeId}/warehouse/${warehouseId}/shelf/${shelfId}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export function updateSubShelf(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string,
  payload: { name?: string; description?: string }
) {
  return request<SubShelfResponse>(
    `/subshelf/store/${storeId}/warehouse/${warehouseId}/shelf/${shelfId}/${subShelfId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

export function deleteSubShelf(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string
) {
  return request<{ success: boolean; message: string }>(
    `/subshelf/store/${storeId}/warehouse/${warehouseId}/shelf/${shelfId}/${subShelfId}`,
    {
      method: "DELETE",
    }
  );
}

export function addProductToSubShelf(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string,
  payload: {
    name: string;
    sku?: string;
    logo?: string;
    price: number;
    quantity: number;
  }
) {
  return request<{
    success: boolean;
    message: string;
    product: SubShelfProduct;
  }>(
    `/subshelf/store/${storeId}/warehouse/${warehouseId}/shelf/${shelfId}/${subShelfId}/products`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export function getSubShelfProducts(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string
) {
  return request<GetSubShelfProductsResponse>(
    `/subshelf/store/${storeId}/warehouse/${warehouseId}/shelf/${shelfId}/${subShelfId}/products`
  );
}

export function sellSubShelfProduct(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string,
  productId: string,
  quantity: number
) {
  return request<{
    success: boolean;
    message: string;
    deleted?: boolean;
    remainingQuantity?: number;
  }>(
    `/subshelf/store/${storeId}/warehouse/${warehouseId}/shelf/${shelfId}/${subShelfId}/products/${productId}/sell`,
    {
      method: "POST",
      body: JSON.stringify({ quantity }),
    }
  );
}

export const addSubShelfProduct = addProductToSubShelf;