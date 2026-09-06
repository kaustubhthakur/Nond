"use client";

import { useEffect, useState } from "react";

import { getMyStores } from "@/lib/store";
import { getSales, normalizeSale } from "@/lib/salesApi";

import { HighestSellingHighlightCard } from "@/components/dashboard/HighestSellingHighlightCard";
import type { HighestSellingItem } from "@/types/dashboardStats";

export function HighestSellingHighlightSection() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [item, setItem] = useState<HighestSellingItem | null>(null);
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

        const { sales } = await getSales(storeId!, 500);

        // Sum quantity sold per product across every line item of every sale
        // (a single sale can itself contain multiple products/quantities).
        const totals = new Map<string, { productName: string; quantitySold: number }>();

        for (const raw of sales) {
          const sale = normalizeSale(raw);
          for (const line of sale.items) {
            const key = line.productId ?? line.productName;
            const existing = totals.get(key);
            if (existing) {
              existing.quantitySold += line.quantity;
            } else {
              totals.set(key, {
                productName: line.productName,
                quantitySold: line.quantity,
              });
            }
          }
        }

        let best: HighestSellingItem | null = null;
        for (const [productKey, { productName, quantitySold }] of totals) {
          if (!best || quantitySold > best.quantitySold) {
            best = { productKey, productName, quantitySold };
          }
        }

        if (!cancelled) setItem(best);
      } catch (err) {
        console.error("Could not compute highest selling item", err);
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Could not load sales data.");
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
      <div className="flex h-24 items-center justify-center rounded-2xl border border-line bg-paper text-sm text-ink/50 shadow-sm">
        Checking sales...
      </div>
    );
  }

  return <HighestSellingHighlightCard item={item} />;
}