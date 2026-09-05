import { apiFetch } from "./api";
import { SellOverviewProduct } from "./sellApi";

export interface Sale {
  id: string;
  storeId: string;
  warehouseId: string;
  warehouseName: string | null;
  level: "shelf" | "subShelf" | "box";
  shelfId: string | null;
  shelfName: string | null;
  subShelfId: string | null;
  subShelfName: string | null;
  boxId: string | null;
  boxName: string | null;
  productId: string | null;
  productName: string;
  sku: string | null;
  price: number;
  quantity: number;
  total: number;
  soldBy: string | null;
  soldAt: string;
}

export function getSales(storeId: string, limit = 100) {
  return apiFetch<{ success: boolean; count: number; sales: Sale[] }>(
    `/sale/store/${storeId}?limit=${limit}`
  );
}

export function recordSale(
  storeId: string,
  product: SellOverviewProduct,
  quantity: number
) {
  return apiFetch<{ success: boolean; message: string; sale: Sale }>(
    `/sale/store/${storeId}`,
    {
      method: "POST",
      body: JSON.stringify({
        warehouseId: product.warehouseId,
        warehouseName: product.warehouseName,
        level: product.level,
        shelfId: product.shelfId,
        shelfName: product.shelfName,
        subShelfId: product.subShelfId,
        subShelfName: product.subShelfName,
        boxId: product.boxId,
        boxName: product.boxName,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        price: product.price,
        quantity,
      }),
    }
  );
}