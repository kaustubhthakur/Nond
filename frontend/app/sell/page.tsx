"use client";

import { useMemo, useState, useEffect } from "react";
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

const ALL_SHELVES = "__all__";
const LOW_STOCK_THRESHOLD = 5;

function formatMoney(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// ASSUMPTION: product.path looks like "Shelf / SubShelf / Box".
// We use the first segment as the shelf label.
function getShelfLabel(product: SellOverviewProduct) {
  if (product.shelfName) return product.shelfName;
  if (!product.path) return product.shelfId ?? "Unassigned";
  const parts = product.path
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts[0] ?? product.shelfId ?? "Unassigned";
}

function levelBadgeClass(level: SellOverviewProduct["level"]) {
  switch (level) {
    case "shelf":
      return "bg-accent/10 text-accent";
    case "subShelf":
      return "bg-ink/10 text-ink/70";
    default:
      return "bg-rust/10 text-rust";
  }
}

function levelLabel(level: SellOverviewProduct["level"]) {
  return level === "shelf" ? "Shelf" : level === "subShelf" ? "Sub-shelf" : "Box";
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

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-line bg-paper px-4 py-3">
      <div className="eyebrow text-ink/50">{label}</div>
      <div className="mt-1 text-lg font-semibold text-ink">{value}</div>
    </div>
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

  const [activeWarehouse, setActiveWarehouse] = useState<string | null>(null);
  const [activeShelfKey, setActiveShelfKey] = useState<string | null>(null);

  const [selected, setSelected] = useState<SellOverviewProduct | null>(null);
  const [sellQty, setSellQty] = useState(1);
  const [sellDate, setSellDate] = useState(() => toDatetimeLocalValue(new Date()));
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

  // ---- Filtering & grouping ----

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.sku ?? "").toLowerCase().includes(term)
    );
  }, [products, search]);

  const warehouseItemsByName = useMemo(() => {
    const map = new Map<string, SellOverviewProduct[]>();
    for (const p of filteredProducts) {
      const list = map.get(p.warehouseName) ?? [];
      list.push(p);
      map.set(p.warehouseName, list);
    }
    return map;
  }, [filteredProducts]);

  const warehouseStats = useMemo(() => {
    return Array.from(warehouseItemsByName.entries())
      .map(([name, items]) => ({
        name,
        items,
        totalQty: items.reduce((sum, p) => sum + p.quantity, 0),
        totalValue: items.reduce((sum, p) => sum + p.quantity * p.price, 0),
      }))
      .sort((a, b) => b.totalQty - a.totalQty);
  }, [warehouseItemsByName]);

  const topWarehouses = warehouseStats.slice(0, 2);
  const otherWarehouses = warehouseStats.slice(2);

  const resolvedWarehouseName =
    activeWarehouse && warehouseItemsByName.has(activeWarehouse)
      ? activeWarehouse
      : warehouseStats[0]?.name ?? null;

 const shelfStats = useMemo(() => {
  const items = resolvedWarehouseName
    ? warehouseItemsByName.get(resolvedWarehouseName) ?? []
    : [];

  type ShelfEntry = { key: string; label: string; items: SellOverviewProduct[]; totalQty: number };
  const map = new Map<string, ShelfEntry>();

  for (const p of items) {
    const key = p.shelfId ?? getShelfLabel(p);
    const entry = map.get(key) ?? { key, label: getShelfLabel(p), items: [], totalQty: 0 };
    entry.items.push(p);
    entry.totalQty += p.quantity;
    map.set(key, entry);
  }

  return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
}, [warehouseItemsByName, resolvedWarehouseName]);

  const topShelves = shelfStats.slice(0, 2);
  const otherShelves = shelfStats.slice(2);

  const resolvedShelfKey =
    activeShelfKey === ALL_SHELVES ||
    (activeShelfKey && shelfStats.some((s) => s.key === activeShelfKey))
      ? activeShelfKey
      : shelfStats[0]?.key ?? ALL_SHELVES;

  const displayedProducts = useMemo(() => {
    if (resolvedShelfKey === ALL_SHELVES || !resolvedShelfKey) {
      return shelfStats.flatMap((s) => s.items);
    }
    return shelfStats.find((s) => s.key === resolvedShelfKey)?.items ?? [];
  }, [shelfStats, resolvedShelfKey]);

  // ---- Metrics ----

  const totalWarehouses = warehouseStats.length;
  const totalSkus = filteredProducts.length;
  const totalUnits = filteredProducts.reduce((sum, p) => sum + p.quantity, 0);
  const totalStockValue = filteredProducts.reduce(
    (sum, p) => sum + p.quantity * p.price,
    0
  );

  // ---- Sell modal ----

  const openSellModal = (product: SellOverviewProduct) => {
    setSelected(product);
    setSellQty(1);
    setSellDate(toDatetimeLocalValue(new Date()));
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

    if (!sellDate) {
      setModalError("Please pick a valid date");
      return;
    }

    const soldAtIso = new Date(sellDate).toISOString();

    setSelling(true);
    setModalError(null);

    try {
      await sellAtLocation(storeId, selected, sellQty);
      const { sale } = await recordSale(storeId, selected, sellQty, soldAtIso);

      setSales((prev) => [sale, ...prev]);

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
      <div className="max-w-5xl mx-auto px-4 py-10 text-ink/60">
        Loading store…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display italic text-2xl text-ink">Sell</h1>
          <p className="text-sm text-ink/50 mt-0.5">
            {store?.name ?? "Store"} · Point of sale
          </p>
        </div>
        <div className="w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product by name or SKU"
            className="w-full border border-line rounded-full px-4 py-2 text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Warehouses" value={totalWarehouses} />
        <MetricCard label="Active SKUs" value={totalSkus} />
        <MetricCard label="Units in stock" value={totalUnits.toLocaleString("en-IN")} />
        <MetricCard label="Stock value" value={formatMoney(totalStockValue)} />
      </div>

      {loading && <p className="text-ink/60 text-sm">Loading products…</p>}
      {error && <p className="text-rust text-sm">{error}</p>}

      {!loading && warehouseStats.length === 0 && (
        <p className="text-ink/60 text-sm">No products found.</p>
      )}

      {!loading && warehouseStats.length > 0 && (
        <section className="rounded-xl border border-line bg-paper shadow-sm overflow-hidden">
          <div className="p-5 border-b border-line space-y-4">
            {/* Warehouse selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow text-ink/50 mr-1">Warehouse</span>
              {topWarehouses.map((w) => (
                <button
                  key={w.name}
                  type="button"
                  onClick={() => {
                    setActiveWarehouse(w.name);
                    setActiveShelfKey(null);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    resolvedWarehouseName === w.name
                      ? "bg-accent text-paper border-accent"
                      : "border-line text-ink/70 hover:border-accent/50"
                  }`}
                >
                  {w.name}
                  <span className="ml-1.5 text-xs opacity-70">
                    {w.totalQty} units
                  </span>
                </button>
              ))}

              {otherWarehouses.length > 0 && (
                <select
                  value={
                    otherWarehouses.some((w) => w.name === resolvedWarehouseName)
                      ? resolvedWarehouseName ?? ""
                      : ""
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      setActiveWarehouse(e.target.value);
                      setActiveShelfKey(null);
                    }
                  }}
                  className="border border-line rounded-full px-3 py-1.5 text-sm text-ink/70 bg-paper focus:outline-none focus:border-accent transition-colors"
                >
                  <option value="">More warehouses…</option>
                  {otherWarehouses.map((w) => (
                    <option key={w.name} value={w.name}>
                      {w.name} · {w.totalQty} units
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Shelf selector */}
            {shelfStats.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="eyebrow text-ink/50 mr-1">Shelf</span>
                <button
                  type="button"
                  onClick={() => setActiveShelfKey(ALL_SHELVES)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    resolvedShelfKey === ALL_SHELVES
                      ? "bg-ink text-paper border-ink"
                      : "border-line text-ink/70 hover:border-ink/40"
                  }`}
                >
                  All shelves
                </button>
                {topShelves.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setActiveShelfKey(s.key)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      resolvedShelfKey === s.key
                        ? "bg-ink text-paper border-ink"
                        : "border-line text-ink/70 hover:border-ink/40"
                    }`}
                  >
                    {s.label}
                    <span className="ml-1.5 text-xs opacity-70">
                      {s.totalQty} units
                    </span>
                  </button>
                ))}

                {otherShelves.length > 0 && (
                  <select
                    value={
                      otherShelves.some((s) => s.key === resolvedShelfKey)
                        ? resolvedShelfKey ?? ""
                        : ""
                    }
                    onChange={(e) => {
                      if (e.target.value) setActiveShelfKey(e.target.value);
                    }}
                    className="border border-line rounded-full px-3 py-1.5 text-sm text-ink/70 bg-paper focus:outline-none focus:border-ink/40 transition-colors"
                  >
                    <option value="">More shelves…</option>
                    {otherShelves.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label} · {s.totalQty} units
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Product grid */}
          <div className="p-5">
            {displayedProducts.length === 0 ? (
              <p className="text-ink/60 text-sm">No products found here.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayedProducts.map((product) => (
                  <button
                    key={`${product.level}-${product.id}`}
                    type="button"
                    onClick={() => {
                      if (!product.id) {
                        alert(
                          "This product has a corrupted ID and can't be sold from here. Please remove and re-add it on the relevant shelf."
                        );
                        return;
                      }
                      openSellModal(product);
                    }}
                    className="text-left border border-line rounded-xl p-4 bg-paper hover:border-accent hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink truncate">
                        {product.name}
                      </span>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium ${levelBadgeClass(
                          product.level
                        )}`}
                      >
                        {levelLabel(product.level)}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-ink/50 truncate">
                      {product.path}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.quantity <= LOW_STOCK_THRESHOLD
                            ? "bg-rust/10 text-rust"
                            : "bg-ink/5 text-ink/70"
                        }`}
                      >
                        {product.quantity} in stock
                      </span>
                      <span className="text-accent font-semibold">
                        {formatMoney(product.price)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recent sales */}
      <section className="space-y-3">
        <h2 className="font-display italic text-xl text-ink">Recent Sales</h2>

        {sales.length === 0 ? (
          <p className="text-ink/60 text-sm">No sales yet.</p>
        ) : (
          <div className="rounded-xl border border-line bg-paper shadow-sm overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-line text-left text-ink/50 eyebrow">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium text-right">Price</th>
                  <th className="px-4 py-3 font-medium text-right">Units</th>
                  <th className="px-4 py-3 font-medium text-right">Subtotal</th>
                  <th className="px-4 py-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-ink/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{sale.productName}</div>
                      <div className="text-ink/50 text-xs">{sale.warehouseName}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-ink/70">
                      {formatMoney(sale.price)}
                    </td>
                    <td className="px-4 py-3 text-right text-ink/70">
                      {sale.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-accent font-semibold">
                      {formatMoney(sale.total)}
                    </td>
                    <td className="px-4 py-3 text-right text-ink/50 text-xs whitespace-nowrap">
                      {formatTime(sale.soldAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Sell modal */}
      {selected && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-20 px-4">
          <div className="bg-paper rounded-2xl shadow-2xl ring-1 ring-ink/5 max-w-sm w-full p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display italic text-lg text-ink">
                  {selected.name}
                </h3>
                <p className="text-xs text-ink/50 mt-0.5">{selected.path}</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="text-ink/40 hover:text-ink/70 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex items-center justify-between text-sm text-ink/70 border-y border-line py-3">
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
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-ink/60 block mb-1">
                Sale date &amp; time
              </label>
              <input
                type="datetime-local"
                value={sellDate}
                onChange={(e) => setSellDate(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
              />
            </div>

            <div className="flex items-center justify-between text-sm bg-ink/[0.03] rounded-lg px-3 py-2">
              <span className="text-ink/60">Total</span>
              <span className="text-accent font-semibold">
                {formatMoney((sellQty || 0) * selected.price)}
              </span>
            </div>

            {modalError && <p className="text-rust text-xs">{modalError}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 border border-ink/20 rounded-lg px-3 py-2 text-sm hover:border-ink/40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSell}
                disabled={selling}
                className="flex-1 bg-accent text-paper rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {selling ? "Selling…" : "Confirm sale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}