"use client";

import { useEffect, useState } from "react";
import { getMyStores } from "@/lib/store";
import { sellBoxProduct } from "@/lib/box";
import { sellSubShelfProduct } from "@/lib/subshelf";
import { sellProductFromShelf } from "@/lib/shelfApi";
import type { SearchResult } from "@/types/search";
import { GlobalSearch } from "@/components/inventory/GlobalSearch";
import { StockExitModal } from "@/components/inventory/StockExitModal";

type ExitTarget = {
  productId: string;
  name: string;
  quantity: number;
  sell: (quantity: number) => Promise<void>;
};

export default function DashboardPage() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [exitTarget, setExitTarget] = useState<ExitTarget | null>(null);

  useEffect(() => {
    getMyStores()
      .then(({ stores }) => setStoreId(stores[0]?.id ?? null))
      .catch(() => setError("Could not load your store."))
      .finally(() => setLoading(false));
  }, []);

  const flash = (message: string) => {
    setBanner(message);
    setTimeout(() => setBanner(null), 3500);
  };

  const openExitForSearchResult = (result: SearchResult) => {
    if (!storeId) return;
    const { location } = result;
    let sell: (quantity: number) => Promise<void>;

    if (location.boxId && location.subShelfId && location.shelfId) {
      sell = async (qty) => {
        await sellBoxProduct(
          storeId,
          location.warehouseId,
          location.shelfId!,
          location.subShelfId!,
          location.boxId!,
          result.product.id,
          qty
        );
      };
    } else if (location.subShelfId && location.shelfId) {
      sell = async (qty) => {
        await sellSubShelfProduct(
          storeId,
          location.warehouseId,
          location.shelfId!,
          location.subShelfId!,
          result.product.id,
          qty
        );
      };
    } else if (location.shelfId) {
      sell = async (qty) => {
        await sellProductFromShelf(storeId, location.warehouseId, location.shelfId!, result.product.id, qty);
      };
    } else {
      return;
    }

    setExitTarget({
      productId: result.product.id,
      name: result.product.name ?? "Product",
      quantity: result.product.quantity,
      sell,
    });
  };

  const submitExit = async (quantity: number) => {
    if (!exitTarget) return;
    await exitTarget.sell(quantity);
    flash(`Removed ${quantity} × "${exitTarget.name}".`);
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <p className="eyebrow mb-2">Dashboard</p>
        <h1 className="font-display text-3xl text-ink mb-6">Sell products</h1>
        {storeId && <GlobalSearch storeId={storeId} onSell={openExitForSearchResult} />}
      </header>

      {loading && <p className="font-mono text-sm text-ink/50">Loading…</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      {banner && (
        <div className="mb-6 rounded-full bg-emerald-700/10 px-4 py-2 text-sm text-emerald-800">
          {banner}
        </div>
      )}

      {!loading && !error && !storeId && (
        <p className="text-ink/60">No store found for your account.</p>
      )}

      <StockExitModal
        open={exitTarget !== null}
        productName={exitTarget?.name ?? ""}
        currentQuantity={exitTarget?.quantity ?? 0}
        onClose={() => setExitTarget(null)}
        onSubmit={submitExit}
      />
    </main>
  );
}