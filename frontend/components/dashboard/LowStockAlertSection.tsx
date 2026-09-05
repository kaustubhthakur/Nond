"use client";

import { useEffect, useState } from "react";

import { getMyStores } from "@/lib/store";
import { getWarehouses } from "@/lib/warehouseApi";
import { getShelfProducts, getShelves } from "@/lib/shelfApi";
import { getSubShelfProducts, getSubShelves } from "@/lib/subshelf";
import { getBoxProducts, getBoxes } from "@/lib/box";

import { LowStockTable } from "@/components/dashboard/LowStockTable";
import type { LowStockItem } from "@/types/dashboardStats";

const LOW_STOCK_THRESHOLD = 2;
const MAX_ROWS = 6;

export function LowStockAlertSection() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyStores()
      .then(({ stores }) => setStoreId(stores[0]?.id ?? null))
      .catch(() => setError("Could not load your store."));
  }, []);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadLowStock() {
      try {
        setLoading(true);
        setError(null);

        const found: LowStockItem[] = [];
        const pushIfLow = (productId: string, productName: string, quantity: number) => {
          if (quantity <= LOW_STOCK_THRESHOLD) {
            found.push({ productId, productName, quantity });
          }
        };

        const warehouseResponse = await getWarehouses(storeId);

        for (const warehouse of warehouseResponse.warehouses) {
          let shelvesResponse;
          try {
            shelvesResponse = await getShelves(storeId, warehouse.id);
          } catch {
            continue;
          }

          for (const shelf of shelvesResponse.shelves) {
            try {
              const shelfProductsResponse = await getShelfProducts(storeId, warehouse.id, shelf.id);
              shelfProductsResponse.products.forEach((product) => {
                pushIfLow(
                  `shelf-${warehouse.id}-${shelf.id}-${product.id}`,
                  product.name ?? "Product",
                  Number(product.quantity ?? 0)
                );
              });
            } catch {
              // ignore, keep aggregating
            }

            let subShelvesResponse;
            try {
              subShelvesResponse = await getSubShelves(storeId, warehouse.id, shelf.id);
            } catch {
              continue;
            }

            for (const subShelf of subShelvesResponse.subShelves) {
              try {
                const subShelfProductsResponse = await getSubShelfProducts(storeId, warehouse.id, shelf.id, subShelf.id);
                subShelfProductsResponse.products.forEach((product) => {
                  pushIfLow(
                    `subshelf-${warehouse.id}-${shelf.id}-${subShelf.id}-${product.id}`,
                    product.name ?? "Product",
                    Number(product.quantity ?? 0)
                  );
                });
              } catch {
                // ignore
              }

              let boxesResponse;
              try {
                boxesResponse = await getBoxes(storeId, warehouse.id, shelf.id, subShelf.id);
              } catch {
                continue;
              }

              for (const box of boxesResponse.boxes) {
                try {
                  const boxProductsResponse = await getBoxProducts(storeId, warehouse.id, shelf.id, subShelf.id, box.id);
                  boxProductsResponse.products.forEach((product) => {
                    pushIfLow(
                      `box-${warehouse.id}-${shelf.id}-${subShelf.id}-${box.id}-${product.id}`,
                      product.name ?? "Product",
                      Number(product.quantity ?? 0)
                    );
                  });
                } catch {
                  // ignore
                }
              }
            }
          }
        }

        found.sort((a, b) => a.quantity - b.quantity);

        if (!cancelled) setItems(found.slice(0, MAX_ROWS));
      } catch (err) {
        console.error("Could not compute low stock alert", err);
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load low stock data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLowStock();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-line bg-paper text-sm text-ink/50 shadow-sm">
        Checking stock levels...
      </div>
    );
  }

  return <LowStockTable items={items} />;
}