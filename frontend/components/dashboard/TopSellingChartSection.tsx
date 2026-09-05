"use client";

import { useEffect, useState } from "react";

import { getMyStores } from "@/lib/store";
import { getWarehouses } from "@/lib/warehouseApi";
import { getShelfProducts, getShelves } from "@/lib/shelfApi";
import { getSubShelfProducts, getSubShelves } from "@/lib/subshelf";
import { getBoxProducts, getBoxes } from "@/lib/box";

import { TopSellingPieChart } from "@/components/dashboard/TopSellingPieChart";
import type { TopSellingSlice } from "@/types/dashboardStats";

const COLORS = ["#0ea5e9", "#1d4ed8", "#38bdf8", "#0284c7", "#7dd3fc"];
const MAX_SLICES = 4;

export function TopSellingChartSection() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [data, setData] = useState<TopSellingSlice[]>([]);
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

    async function loadTopSelling() {
      try {
        setLoading(true);
        setError(null);

        // productName -> total quantity across every shelf/subshelf/box
        const totals = new Map<string, number>();

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
                const name = product.name ?? "Product";
                totals.set(name, (totals.get(name) ?? 0) + Number(product.quantity ?? 0));
              });
            } catch {
              // ignore, keep aggregating what we can
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
                  const name = product.name ?? "Product";
                  totals.set(name, (totals.get(name) ?? 0) + Number(product.quantity ?? 0));
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
                    const name = product.name ?? "Product";
                    totals.set(name, (totals.get(name) ?? 0) + Number(product.quantity ?? 0));
                  });
                } catch {
                  // ignore
                }
              }
            }
          }
        }

        const sorted = Array.from(totals.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, MAX_SLICES);

        const slices: TopSellingSlice[] = sorted.map(([name, value], index) => ({
          name,
          value,
          color: COLORS[index % COLORS.length],
        }));

        if (!cancelled) setData(slices);
      } catch (err) {
        console.error("Could not compute top selling devices", err);
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load chart data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTopSelling();
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
        Loading chart...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-line bg-paper text-sm text-ink/50 shadow-sm">
        No product data yet.
      </div>
    );
  }

  return <TopSellingPieChart data={data} />;
}