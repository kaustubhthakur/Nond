"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import {
  getSellOverview,
  flattenProducts,
  SellOverviewProduct,
} from "@/lib/sellApi";
import { getSales, recordSale, Sale } from "@/lib/salesApi";
import { sellProductFromShelf } from "@/lib/shelfApi";
import { sellSubShelfProduct } from "@/lib/subshelf";
import { sellBoxProduct } from "@/lib/box";

function formatMoney(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function sellAtLocation(
  storeId: string,
  product: SellOverviewProduct,
  quantity: number
) {
  if (product.level === "shelf") {
    return sellProductFromShelf(
      storeId,
      product.warehouseId,
      product.shelfId!,
      product.id,
      quantity
    );
  }

  if (product.level === "subShelf") {
    return sellSubShelfProduct(
      storeId,
      product.warehouseId,
      product.shelfId!,
      product.subShelfId!,
      product.id,
      quantity
    );
  }

  return sellBoxProduct(
    storeId,
    product.warehouseId,
    product.shelfId!,
    product.subShelfId!,
    product.boxId!,
    product.id,
    quantity
  );
}

export default function SellPage() {
  const { store } = useStore();
  const storeId = store?.id ? String(store.id) : null;

  const [products, setProducts] = useState<SellOverviewProduct[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<SellOverviewProduct | null>(null);
  const [sellQty, setSellQty] = useState(1);
  const [selling, setSelling] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadOverview = async (id: string) => {
    const [overview, salesRes] = await Promise.all([
      getSellOverview(id),
      getSales(id),
    ]);
    setProducts(flattenProducts(overview.warehouses));
    setSales(salesRes.sales);
  };

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    loadOverview(storeId)
      .catch((err) => setError(err.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, [storeId]);

  const grouped = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            (p.sku ?? "").toLowerCase().includes(term)
        )
      : products;

    const byWarehouse = new Map<string, SellOverviewProduct[]>();

    for (const p of filtered) {
      const list = byWarehouse.get(p.warehouseName) ?? [];
      list.push(p);
      byWarehouse.set(p.warehouseName, list);
    }

    return Array.from(byWarehouse.entries());
  }, [products, search]);

  const openSellModal = (product: SellOverviewProduct) => {
    setSelected(product);
    setSellQty(1);
    setModalError(null);
  };

  const closeModal = () => {
    setSelected(null);
    setModalError(null);
  };

  const confirmSell = async () => {
    if (!selected || !storeId) return;

    if (sellQty <= 0 || sellQty > selected.quantity) {
      setModalError(`Enter a quantity between 1 and ${selected.quantity}`);
      return;
    }

    setSelling(true);
    setModalError(null);

    try {
      await sellAtLocation(storeId, selected, sellQty);
      await recordSale(storeId, selected, sellQty);
      await loadOverview(storeId);
      closeModal();
    } catch (err: any) {
      setModalError(err?.message ?? "Failed to record sale");
    } finally {
      setSelling(false);
    }
  };

  if (!storeId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-ink/60">
        Loading store…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product by Name or SKU"
          className="w-full border border-line rounded-full px-4 py-2 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      {loading && <p className="text-ink/60 text-sm">Loading products…</p>}
      {error && <p className="text-rust text-sm">{error}</p>}

      {!loading &&
        grouped.map(([warehouseName, items]) => (
          <section key={warehouseName} className="space-y-3">
            <h2 className="font-display italic text-xl text-ink">
              {warehouseName}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((product) => (
                <button
                  key={`${product.level}-${product.id}`}
                  type="button"
                  onClick={() => openSellModal(product)}
                  className="text-left border border-line rounded-lg p-4 hover:border-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">
                      {product.name}
                    </span>
                    <span className="eyebrow text-ink/50">
                      {product.level === "shelf"
                        ? "Shelf"
                        : product.level === "subShelf"
                        ? "Sub-shelf"
                        : "Box"}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-ink/60">
                    {product.path}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-ink/70">
                      Qty: <strong>{product.quantity}</strong>
                    </span>
                    <span className="text-accent font-medium">
                      {formatMoney(product.price)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}

      {!loading && grouped.length === 0 && (
        <p className="text-ink/60 text-sm">No products found.</p>
      )}

      <section className="space-y-3">
        <h2 className="font-display italic text-xl text-ink">
          Recent Sales
        </h2>

        {sales.length === 0 ? (
          <p className="text-ink/60 text-sm">No sales yet.</p>
        ) : (
          <div className="border border-line rounded-lg divide-y divide-line">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="p-3 flex items-center justify-between text-sm"
              >
                <div>
                  <div className="font-medium text-ink">
                    {sale.productName}
                  </div>
                  <div className="text-ink/50 text-xs">
                    {sale.warehouseName} · {formatTime(sale.soldAt)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-accent font-medium">
                    {formatMoney(sale.total)}
                  </div>
                  <div className="text-ink/50 text-xs">
                    Qty {sale.quantity} × {formatMoney(sale.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-20 px-4">
          <div className="bg-paper rounded-lg shadow-lg max-w-sm w-full p-6 space-y-4">
            <div>
              <h3 className="font-display italic text-lg text-ink">
                {selected.name}
              </h3>
              <p className="text-xs text-ink/50">{selected.path}</p>
            </div>

            <div className="flex items-center justify-between text-sm text-ink/70">
              <span>Available: {selected.quantity}</span>
              <span>{formatMoney(selected.price)} / unit</span>
            </div>

            <div>
              <label className="text-xs text-ink/60 block mb-1">
                Quantity to sell
              </label>
              <input
                type="number"
                min={1}
                max={selected.quantity}
                value={sellQty}
                onChange={(e) => setSellQty(Number(e.target.value))}
                className="w-full border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-ink/60">Total</span>
              <span className="text-accent font-medium">
                {formatMoney((sellQty || 0) * selected.price)}
              </span>
            </div>

            {modalError && (
              <p className="text-rust text-xs">{modalError}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 border border-ink/20 rounded px-3 py-2 text-sm hover:border-ink/40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSell}
                disabled={selling}
                className="flex-1 bg-accent text-paper rounded px-3 py-2 text-sm disabled:opacity-50"
              >
                {selling ? "Selling…" : "Click to sell"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}