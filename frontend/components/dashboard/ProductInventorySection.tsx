"use client";

import { useMemo, useState } from "react";
import { PackagePlus, Search, ShoppingCart } from "lucide-react";

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
      <div className="border-b border-line px-6 py-5">
        <div className="mx-auto max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products by name or SKU..."
              className="w-full rounded-full border border-line bg-paper py-3 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-accent"
            />
          </div>
        </div>
      </div>

      {/* BANNER */}
      {banner && (
        <div className="mx-6 mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {banner}
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse">
          <thead>
            <tr className="bg-paper">
              <th className="border-b border-r border-line px-5 py-4 text-left text-sm font-semibold text-ink">Warehouse</th>
              <th className="border-b border-r border-line px-5 py-4 text-left text-sm font-semibold text-ink">Product</th>
              <th className="border-b border-r border-line px-5 py-4 text-left text-sm font-semibold text-ink">Location</th>
              <th className="border-b border-r border-line px-5 py-4 text-center text-sm font-semibold text-ink">Qty. in Stock</th>
         
              <th className="border-b border-line px-5 py-4 text-center text-sm font-semibold text-ink">Sell Qty</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-sm text-ink/50">
                  Loading products from all warehouses...
                </td>
              </tr>
            )}
            {!loading && filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-sm text-ink/50">
                  No products found.
                </td>
              </tr>
            )}
            {!loading &&
              filteredProducts.map((product) => (
                <tr key={product.rowId} className="transition-colors hover:bg-ink/[0.02]">
                  <td className="border-b border-r border-line px-5 py-4">
                    <div className="font-medium text-ink">{product.warehouseName}</div>
                    <div className="mt-1 font-mono text-xs text-ink/40">{product.warehouseId}</div>
                  </td>
                  <td className="border-b border-r border-line px-5 py-4">
                    <div className="font-medium text-ink">{product.productName}</div>
                    {product.sku && <div className="mt-1 text-xs text-ink/40">SKU: {product.sku}</div>}
                  </td>
                  <td className="border-b border-r border-line px-5 py-4">
                    <span className="text-sm text-ink/70">{product.location}</span>
                  </td>
                  <td className="border-b border-r border-line px-5 py-4 text-center">
                    <span className="rounded-md bg-ink/5 px-3 py-1.5 text-sm font-semibold text-ink">{product.quantity}</span>
                  </td>
                  
                  <td className="border-b border-line px-5 py-4 text-center">
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
                      className="inline-flex min-w-[110px] items-center justify-center gap-2 rounded-lg border border-red-400 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Sell
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

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