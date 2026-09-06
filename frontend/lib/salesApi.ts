import { apiFetch } from "./api";
import { SellOverviewProduct } from "./sellApi";

export interface SaleItem {
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
  subtotal: number;
}

export interface Sale {
  id: string;
  storeId: string;
  items: SaleItem[];
  itemCount: number;
  totalUnits: number;
  total: number;
  soldBy: string | null;
  soldAt: string;
}

export interface CartLine {
  product: SellOverviewProduct;
  quantity: number;
}

export function getSales(storeId: string, limit = 100) {
  return apiFetch<{ success: boolean; count: number; sales: Sale[] }>(
    `/sale/store/${storeId}?limit=${limit}`
  );
}

// lines.length === 1 for a quick single sell, > 1 for a bulk cart checkout.
// Either way this writes exactly one Sale document.
export function recordSale(storeId: string, lines: CartLine[], soldAt: string) {
  return apiFetch<{ success: boolean; message: string; sale: Sale }>(
    `/sale/store/${storeId}`,
    {
      method: "POST",
      body: JSON.stringify({
        items: lines.map(({ product, quantity }) => ({
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
        })),
        soldAt,
      }),
    }
  );
}

// Old sales (recorded before the items[] migration) have flat fields instead
// of an items array. Normalize every sale into the new shape so the UI never
// has to special-case it.
export function normalizeSale(raw: any): Sale {
  if (Array.isArray(raw.items)) {
    const items: SaleItem[] = raw.items.map((item: any) => ({
      warehouseId: item.warehouseId ?? null,
      warehouseName: item.warehouseName ?? null,
      level: item.level,
      shelfId: item.shelfId ?? null,
      shelfName: item.shelfName ?? null,
      subShelfId: item.subShelfId ?? null,
      subShelfName: item.subShelfName ?? null,
      boxId: item.boxId ?? null,
      boxName: item.boxName ?? null,
      productId: item.productId ?? null,
      productName: item.productName ?? "Unnamed product",
      sku: item.sku ?? null,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 0,
      subtotal:
        typeof item.subtotal === "number"
          ? item.subtotal
          : (Number(item.price) || 0) * (Number(item.quantity) || 0),
    }));

    return {
      id: raw.id,
      storeId: raw.storeId,
      items,
      itemCount: raw.itemCount ?? items.length,
      totalUnits:
        raw.totalUnits ?? items.reduce((sum, i) => sum + i.quantity, 0),
      total: raw.total ?? items.reduce((sum, i) => sum + i.subtotal, 0),
      soldBy: raw.soldBy ?? null,
      soldAt: raw.soldAt,
    };
  }

  // Legacy single-product shape: { productName, price, quantity, ... }
  const price = Number(raw.price) || 0;
  const quantity = Number(raw.quantity) || 0;
  const legacyItem: SaleItem = {
    warehouseId: raw.warehouseId ?? null,
    warehouseName: raw.warehouseName ?? null,
    level: raw.level ?? "shelf",
    shelfId: raw.shelfId ?? null,
    shelfName: raw.shelfName ?? null,
    subShelfId: raw.subShelfId ?? null,
    subShelfName: raw.subShelfName ?? null,
    boxId: raw.boxId ?? null,
    boxName: raw.boxName ?? null,
    productId: raw.productId ?? null,
    productName: raw.productName ?? "Unnamed product",
    sku: raw.sku ?? null,
    price,
    quantity,
    subtotal: typeof raw.total === "number" ? raw.total : price * quantity,
  };

  return {
    id: raw.id,
    storeId: raw.storeId,
    items: [legacyItem],
    itemCount: 1,
    totalUnits: quantity,
    total: legacyItem.subtotal,
    soldBy: raw.soldBy ?? null,
    soldAt: raw.soldAt,
  };
}