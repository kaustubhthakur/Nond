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
  costPrice: number | null;
  profit: number | null;
}

export interface Sale {
  id: string;
  storeId: string;
  items: SaleItem[];
  itemCount: number;
  totalUnits: number;
  total: number;
  totalProfit: number;
  profitDataComplete: boolean;
  soldBy: string | null;
  soldAt: string;
}

export interface CartLine {
  product: SellOverviewProduct;
  quantity: number;
  salePrice: number; // editable at point of sale; defaults to product.price
}

export function getSales(storeId: string, limit = 100) {
  return apiFetch<{ success: boolean; count: number; sales: Sale[] }>(
    `/sale/store/${storeId}?limit=${limit}`
  );
}

// lines.length === 1 for a quick single sell, > 1 for a bulk cart checkout.
// Either way this writes exactly one Sale document.
export function recordSale(
  storeId: string,
  lines: CartLine[],
  soldAt: string
) {
  const items = lines.map(({ product, quantity, salePrice }) => {
    const price = Number(salePrice);
    const qty = Number(quantity);

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(
        `Invalid sale price for "${product.name}": ${salePrice}`
      );
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error(
        `Invalid quantity for "${product.name}": ${quantity}`
      );
    }

    return {
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

  
      price,

      costPrice:
        product.costPrice !== null &&
        Number.isFinite(Number(product.costPrice))
          ? Number(product.costPrice)
          : null,

      quantity: qty,
    };
  });

  console.log("SALE PAYLOAD:", {
    items,
    soldAt,
  });

  return apiFetch<{ success: boolean; message: string; sale: Sale }>(
    `/sale/store/${storeId}`,
    {
      method: "POST",
      body: JSON.stringify({
        items,
        soldAt,
      }),
    }
  );
}


export function normalizeSale(raw: any): Sale {
  if (Array.isArray(raw.items)) {
    const items: SaleItem[] = raw.items.map((item: any) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      const costPrice =
        typeof item.costPrice === "number" ? item.costPrice : null;

      return {
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
        price,
        quantity,
        subtotal:
          typeof item.subtotal === "number" ? item.subtotal : price * quantity,
        costPrice,
        profit:
          typeof item.profit === "number"
            ? item.profit
            : costPrice !== null
            ? (price - costPrice) * quantity
            : null,
      };
    });

    const totalProfit =
      typeof raw.totalProfit === "number"
        ? raw.totalProfit
        : items.reduce((sum, i) => sum + (i.profit ?? 0), 0);

    return {
      id: raw.id,
      storeId: raw.storeId,
      items,
      itemCount: raw.itemCount ?? items.length,
      totalUnits:
        raw.totalUnits ?? items.reduce((sum, i) => sum + i.quantity, 0),
      total: raw.total ?? items.reduce((sum, i) => sum + i.subtotal, 0),
      totalProfit,
      profitDataComplete:
        typeof raw.profitDataComplete === "boolean"
          ? raw.profitDataComplete
          : items.every((i) => i.profit !== null),
      soldBy: raw.soldBy ?? null,
      soldAt: raw.soldAt,
    };
  }

  // Legacy single-product shape: { productName, price, quantity, ... }
  const price = Number(raw.price) || 0;
  const quantity = Number(raw.quantity) || 0;
  const costPrice = typeof raw.costPrice === "number" ? raw.costPrice : null;
  const profit = costPrice !== null ? (price - costPrice) * quantity : null;

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
    costPrice,
    profit,
  };

  return {
    id: raw.id,
    storeId: raw.storeId,
    items: [legacyItem],
    itemCount: 1,
    totalUnits: quantity,
    total: legacyItem.subtotal,
    totalProfit: profit ?? 0,
    profitDataComplete: profit !== null,
    soldBy: raw.soldBy ?? null,
    soldAt: raw.soldAt,
  };
}