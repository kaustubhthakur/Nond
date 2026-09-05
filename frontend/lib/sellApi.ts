import { apiFetch } from "./api";

export interface SellOverviewProduct {
  id: string;
  name: string;
  sku: string | null;
  logo: string | null;
  price: number;
  quantity: number;
  level: "shelf" | "subShelf" | "box";
  path: string;
  warehouseId: string;
  warehouseName: string;
  shelfId: string | null;
  shelfName: string | null;
  subShelfId: string | null;
  subShelfName: string | null;
  boxId: string | null;
  boxName: string | null;
}

interface SellOverviewBox {
  id: string;
  name: string;
  capacity: number;
  productQuantity: number;
  products: SellOverviewProduct[];
}

interface SellOverviewSubShelf {
  id: string;
  name: string;
  capacity: number;
  productQuantity: number;
  products: SellOverviewProduct[];
  boxes: SellOverviewBox[];
}

interface SellOverviewShelf {
  id: string;
  name: string;
  capacity: number;
  productQuantity: number;
  products: SellOverviewProduct[];
  subShelves: SellOverviewSubShelf[];
}

export interface SellOverviewWarehouse {
  id: string;
  name: string;
  shelves: SellOverviewShelf[];
}

export function getSellOverview(storeId: string) {
  return apiFetch<{
    success: boolean;
    warehouses: SellOverviewWarehouse[];
  }>(`/sell-overview/store/${storeId}`);
}

// Flattens the tree into one array — the shape the sell page actually renders.
export function flattenProducts(
  warehouses: SellOverviewWarehouse[]
): SellOverviewProduct[] {
  const products: SellOverviewProduct[] = [];

  for (const warehouse of warehouses) {
    for (const shelf of warehouse.shelves) {
      products.push(...shelf.products);

      for (const subShelf of shelf.subShelves) {
        products.push(...subShelf.products);

        for (const box of subShelf.boxes) {
          products.push(...box.products);
        }
      }
    }
  }

  return products;
}