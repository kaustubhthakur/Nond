"use client";

import { useEffect, useState } from "react";

import { getMyStores } from "@/lib/store";
import { getWarehouses } from "@/lib/warehouseApi";
import { getShelfProducts, getShelves } from "@/lib/shelfApi";
import { getSubShelfProducts, getSubShelves } from "@/lib/subshelf";
import { getBoxProducts, getBoxes } from "@/lib/box";

import { InventoryValuationTable } from "@/components/dashboard/InventoryValuationTable";
import type { MonthlyValuation } from "@/types/dashboardStats";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

function getCurrentAndLastMonthLabels() {
  const now = new Date();
  const currentMonthLabel = MONTH_LABELS[now.getMonth()];
  const lastMonthIndex = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const lastMonthLabel = MONTH_LABELS[lastMonthIndex];
  return { currentMonthLabel, lastMonthLabel };
}

export function InventoryValuationSection() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [monthly, setMonthly] = useState<MonthlyValuation[]>([]);
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

    async function load() {
      try {
        setLoading(true);
        setError(null);

        let total = 0;
        const addValue = (quantity: number, price: unknown) => {
          const p = Number(price ?? 0);
          total += (Number.isFinite(p) ? p : 0) * quantity;
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
                addValue(Number(product.quantity ?? 0), (product as { price?: unknown }).price);
              });
            } catch {
              // ignore
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
                  addValue(Number(product.quantity ?? 0), (product as { price?: unknown }).price);
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
                    addValue(Number(product.quantity ?? 0), (product as { price?: unknown }).price);
                  });
                } catch {
                  // ignore
                }
              }
            }
          }
        }

        const { currentMonthLabel } = getCurrentAndLastMonthLabels();
        if (!cancelled) setMonthly([{ month: currentMonthLabel, amount: total }]);
      } catch (err) {
        console.error("Could not compute inventory valuation", err);
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load valuation data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
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
      <div className="flex h-64 items-center justify-center rounded-2xl border border-line bg-paper text-sm text-ink/50 shadow-sm">
        Loading valuation...
      </div>
    );
  }

  const { currentMonthLabel, lastMonthLabel } = getCurrentAndLastMonthLabels();

  return (
    <InventoryValuationTable
      monthly={monthly}
      currentMonthLabel={currentMonthLabel}
      lastMonthLabel={lastMonthLabel}
    />
  );
}