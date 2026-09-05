"use client";

import { useMemo, useState } from "react";
import { PackagePlus, Search, ShoppingCart, MapPin } from "lucide-react";

import {
  addProductToShelf,
  sellProductFromShelf,
} from "@/lib/shelfApi";
import {
  addSubShelfProduct,
  sellSubShelfProduct,
} from "@/lib/subshelf";
import {
  addBoxProduct,
  sellBoxProduct,
} from "@/lib/box";
import { StockExitModal } from "@/components/inventory/StockExitModal";

type ProductLevel = "shelf" | "subshelf" | "box";

export type DashboardProduct = {
  rowId: string;
  productId: string;
  productName: string;
  sku?: string | null;
  quantity: number;
  level: ProductLevel;
  warehouseId: string;
  warehouseName: string;
  shelfId: string;
  shelfName?: string;
  subShelfId?: string;
  subShelfName?: string;
  boxId?: string;
  boxName?: string;
  location: string;
  sell: (quantity: number) => Promise<void>;
};

type ExitTarget = {
  productId: string;
  name: string;
  quantity: number;
  sell: (quantity: number) => Promise<void>;
};

const VISIBLE_LIMIT = 6;

export function ProductInventorySection({
  storeId,
  products,
  loading,
  onChanged,
}: {
  storeId: string | null;
  products: DashboardProduct[];
  loading: boolean;
  onChanged: () => void;
}) {
  const [search, setSearch] = useState("");
  const [banner, setBanner] = useState<string | null>(null);

  const [exitTarget, setExitTarget] = useState<ExitTarget | null>(null);
  const [addTarget, setAddTarget] = useState<DashboardProduct | null>(null);
  const [addQuantity, setAddQuantity] = useState("");
  const [adding, setAdding] = useState(false);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (product) =>
        product.productName.toLowerCase().includes(query) ||
        product.warehouseName.toLowerCase().includes(query) ||
        product.location.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query)
    );
  }, [products, search]);

  const visibleProducts = filteredProducts.slice(0, VISIBLE_LIMIT);
  const remainingCount = filteredProducts.length - visibleProducts.length;

  const flash = (message: string) => {
    setBanner(message);
    window.setTimeout(() => setBanner(null), 3500);
  };

  const submitExit = async (quantity: number) => {
    if (!exitTarget) return;
    await exitTarget.sell(quantity);
    flash(`Removed ${quantity} × "${exitTarget.name}".`);
    setExitTarget(null);
    onChanged();
  };

  const submitAddQuantity = async () => {
    if (!addTarget || !storeId) return;
    const quantity = Number(addQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return;

    setAdding(true);
    try {
      const payload = { name: addTarget.productName, sku: addTarget.sku ?? undefined, quantity };

      if (addTarget.level === "shelf") {
        await addProductToShelf(storeId, addTarget.warehouseId, addTarget.shelfId, payload);
      } else if (addTarget.level === "subshelf" && addTarget.subShelfId) {
        await addSubShelfProduct(storeId, addTarget.warehouseId, addTarget.shelfId, addTarget.subShelfId, payload);
      } else if (addTarget.level === "box" && addTarget.subShelfId && addTarget.boxId) {
        await addBoxProduct(storeId, addTarget.warehouseId, addTarget.shelfId, addTarget.subShelfId, addTarget.boxId, payload);
      }

      flash(`Added ${quantity} × "${addTarget.productName}".`);
      setAddTarget(null);
      setAddQuantity("");
      onChanged();
    } catch (err) {
      console.error(err);
      flash(err instanceof Error ? err.message : "Could not add quantity.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      {/* SEARCH */}
      <div className="border-b border-line px-5 py-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products by name or SKU..."
            className="w-full rounded-full border border-line bg-paper py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition focus:border-accent"
          />
        </div>
      </div>

      {/* BANNER */}
      {banner && (
        <div className="mx-5 mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700">
          {banner}
        </div>
      )}

      {/* LIST */}
      <div className="divide-y divide-line">
        {loading && (
          <p className="px-5 py-12 text-center text-sm text-ink/50">Loading products...</p>
        )}

        {!loading && visibleProducts.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-ink/50">No products found.</p>
        )}

        {!loading &&
          visibleProducts.map((product) => (
            <div key={product.rowId} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-ink/[0.02]">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-medium text-ink">{product.productName}</span>
                  {product.sku && (
                    <span className="shrink-0 text-[11px] text-ink/40">SKU: {product.sku}</span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-ink/50">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{product.location}</span>
                </div>
              </div>

              <span className="shrink-0 rounded-md bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink">
                {product.quantity}
              </span>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setAddTarget(product);
                    setAddQuantity("");
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-emerald-500 p-1.5 text-emerald-600 transition hover:bg-emerald-50"
                  title="Add quantity"
                >
                  <PackagePlus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setExitTarget({
                      productId: product.productId,
                      name: product.productName,
                      quantity: product.quantity,
                      sell: product.sell,
                    })
                  }
                  className="inline-flex items-center justify-center rounded-lg border border-red-400 p-1.5 text-red-600 transition hover:bg-red-50"
                  title="Sell"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* FOOTER */}
      {!loading && remainingCount > 0 && (
        <div className="border-t border-line px-5 py-3 text-center text-xs text-ink/50">
          +{remainingCount} more product{remainingCount === 1 ? "" : "s"} not shown
        </div>
      )}

      {/* ADD QUANTITY MODAL */}
      {addTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-ink">Add Quantity</h2>
            <p className="mt-2 text-sm text-ink/60">{addTarget.productName}</p>
            <p className="mt-1 text-xs text-ink/40">{addTarget.location}</p>
            <input
              type="number"
              min="1"
              autoFocus
              value={addQuantity}
              onChange={(event) => setAddQuantity(event.target.value)}
              placeholder="Enter quantity"
              className="mt-6 w-full rounded-lg border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setAddTarget(null);
                  setAddQuantity("");
                }}
                disabled={adding}
                className="rounded-lg border border-line px-4 py-2 text-sm text-ink/70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAddQuantity}
                disabled={adding}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add Quantity"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELL MODAL */}
      <StockExitModal
        open={exitTarget !== null}
        productName={exitTarget?.name ?? ""}
        currentQuantity={exitTarget?.quantity ?? 0}
        onClose={() => setExitTarget(null)}
        onSubmit={submitExit}
      />
    </>
  );
}