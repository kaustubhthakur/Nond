import { apiFetch } from "./api";
import type {
  Box,
  BoxProduct,
  GetBoxesResponse,
  GetBoxProductsResponse,
} from "@/types/box";

function basePath(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string
) {
  return `/box/store/${storeId}/warehouse/${warehouseId}/shelf/${shelfId}/sub-shelf/${subShelfId}`;
}

interface BoxResponse {
  success: boolean;
  message?: string;
  box: Box;
}

export function getBoxes(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string
) {
  return apiFetch<GetBoxesResponse>(
    basePath(
      storeId,
      warehouseId,
      shelfId,
      subShelfId
    )
  );
}

export function getBox(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string,
  boxId: string
) {
  return apiFetch<BoxResponse>(
    `${basePath(
      storeId,
      warehouseId,
      shelfId,
      subShelfId
    )}/${boxId}`
  );
}

export function createBox(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string,
  payload: {
    name: string;
    description?: string;
  }
) {
  return apiFetch<BoxResponse>(
    basePath(
      storeId,
      warehouseId,
      shelfId,
      subShelfId
    ),
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export function deleteBox(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string,
  boxId: string
) {
  return apiFetch<{
    success: boolean;
    message: string;
  }>(
    `${basePath(
      storeId,
      warehouseId,
      shelfId,
      subShelfId
    )}/${boxId}`,
    {
      method: "DELETE",
    }
  );
}

export function addProductToBox(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string,
  boxId: string,
  payload: {
    name: string;
    sku?: string;
    logo?: string;
    price: number;
    quantity: number;
  }
) {
  return apiFetch<{
    success: boolean;
    message: string;
    product: BoxProduct;
  }>(
    `${basePath(
      storeId,
      warehouseId,
      shelfId,
      subShelfId
    )}/${boxId}/products`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export function getBoxProducts(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string,
  boxId: string
) {
  return apiFetch<GetBoxProductsResponse>(
    `${basePath(
      storeId,
      warehouseId,
      shelfId,
      subShelfId
    )}/${boxId}/products`
  );
}

export function sellBoxProduct(
  storeId: string,
  warehouseId: string,
  shelfId: string,
  subShelfId: string,
  boxId: string,
  productId: string,
  quantity: number
) {
  return apiFetch<{
    success: boolean;
    message: string;
    deleted?: boolean;
  }>(
    `${basePath(
      storeId,
      warehouseId,
      shelfId,
      subShelfId
    )}/${boxId}/products/${productId}/sell`,
    {
      method: "POST",
      body: JSON.stringify({ quantity }),
    }
  );
}