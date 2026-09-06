"use client";

import { useMemo, useState, useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import {
  getSellOverview,
  flattenProducts,
  SellOverviewProduct,
} from "@/lib/sellApi";
import { getSales, recordSale, Sale, CartLine, normalizeSale } from "@/lib/salesApi";
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

// A single product can live in multiple places, so the cart key has to
// include location, not just the product id.
function cartKey(p: SellOverviewProduct) {
  return [p.level, p.id, p.warehouseId, p.shelfId, p.subShelfId, p.boxId]
    .map((v) => v ?? "")
    .join("|");
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

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-paper px-4 py-3.5">
      <div className="text-xs font-medium text-ink/50">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-xl font-semibold text-ink tabular-nums">
          {value}
        </span>
        {hint && <span className="text-xs text-ink/40">{hint}</span>}
      </div>
    </div>
  );
}

function QtyStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const clamp = (n: number) => Math.max(1, Math.min(max, n || 1));
  return (
    <div className="flex items-stretch border border-line rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= 1}
        className="w-10 flex items-center justify-center text-ink/60 hover:bg-ink/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="w-full text-center text-sm font-medium bg-transparent focus:outline-none tabular-nums border-x border-line"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        className="w-10 flex items-center justify-center text-ink/60 hover:bg-ink/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        aria-label="Increase quantity"
      >
        +
      </button>
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

  // ---- Single quick-sell modal ----
  const [selected, setSelected] = useState<SellOverviewProduct | null>(null);
  const [sellQty, setSellQty] = useState(1);
  const [sellDate, setSellDate] = useState(() => toDatetimeLocalValue(new Date()));
  const [selling, setSelling] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // ---- Bulk cart ----
  const [cart, setCart] = useState<Map<string, CartLine>>(new Map());
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutDate, setCheckoutDate] = useState(() =>
    toDatetimeLocalValue(new Date())
  );
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());

 const loadOverview = async (id: string) => {
  const [overview, salesRes] = await Promise.all([
    getSellOverview(id),
    getSales(id),
  ]);
  setProducts(flattenProducts(overview.warehouses));
  setSales(salesRes.sales.map(normalizeSale));
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

    type ShelfEntry = {
      key: string;
      label: string;
      items: SellOverviewProduct[];
      totalQty: number;
    };
    const map = new Map<string, ShelfEntry>();

    for (const p of items) {
      const key = p.shelfId ?? getShelfLabel(p);
      const entry =
        map.get(key) ?? { key, label: getShelfLabel(p), items: [], totalQty: 0 };
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
  const lowStockCount = filteredProducts.filter(
    (p) => p.quantity <= LOW_STOCK_THRESHOLD
  ).length;

  // ---- Single quick-sell modal ----

  const openSellModal = (product: SellOverviewProduct) => {
    if (!product.id) {
      alert(
        "This product has a corrupted ID and can't be sold from here. Please remove and re-add it on the relevant shelf."
      );
      return;
    }
    if (product.quantity <= 0) return;
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
      const { sale } = await recordSale(
        storeId,
        [{ product: selected, quantity: sellQty }],
        soldAtIso
      );

      setSales((prev) => [sale, ...prev]);

      await loadOverview(storeId);
      closeModal();
    } catch (err: any) {
      setModalError(err?.message ?? "Failed to record sale");
    } finally {
      setSelling(false);
    }
  };

  // ---- Bulk cart actions ----

  const addToCart = (product: SellOverviewProduct) => {
    if (!product.id) {
      alert(
        "This product has a corrupted ID and can't be sold from here. Please remove and re-add it on the relevant shelf."
      );
      return;
    }
    if (product.quantity <= 0) return;

    setCart((prev) => {
      const next = new Map(prev);
      const key = cartKey(product);
      const existing = next.get(key);
      const nextQty = Math.min(product.quantity, (existing?.quantity ?? 0) + 1);
      next.set(key, { product, quantity: nextQty });
      return next;
    });
  };

  const updateCartQty = (key: string, qty: number) => {
    setCart((prev) => {
      const line = prev.get(key);
      if (!line) return prev;
      const next = new Map(prev);
      const clamped = Math.max(1, Math.min(line.product.quantity, qty || 1));
      next.set(key, { ...line, quantity: clamped });
      return next;
    });
  };

  const removeFromCart = (key: string) => {
    setCart((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  };

  const clearCart = () => setCart(new Map());

  const cartLines = useMemo(() => Array.from(cart.values()), [cart]);
  const cartCount = cartLines.length;
  const cartTotalUnits = cartLines.reduce((sum, l) => sum + l.quantity, 0);
  const cartTotalValue = cartLines.reduce(
    (sum, l) => sum + l.quantity * l.product.price,
    0
  );

  const openCheckout = () => {
    setCheckoutDate(toDatetimeLocalValue(new Date()));
    setCheckoutError(null);
    setCartOpen(true);
  };

  const confirmCheckout = async () => {
    if (!storeId || cartLines.length === 0) return;

    if (!checkoutDate) {
      setCheckoutError("Please pick a valid date");
      return;
    }

    const soldAtIso = new Date(checkoutDate).toISOString();

    setCheckingOut(true);
    setCheckoutError(null);

    try {
      // Deduct stock at each location one at a time, so a failure
      // tells us exactly which product it happened on.
      for (const line of cartLines) {
        try {
          await sellAtLocation(storeId, line.product, line.quantity);
        } catch (err: any) {
          throw new Error(
            `${line.product.name}: ${err?.message ?? "failed to update stock"}`
          );
        }
      }

      const { sale } = await recordSale(storeId, cartLines, soldAtIso);
      setSales((prev) => [sale, ...prev]);

      clearCart();
      setCartOpen(false);
      await loadOverview(storeId);
    } catch (err: any) {
      setCheckoutError(err?.message ?? "Failed to record sale");
    } finally {
      setCheckingOut(false);
    }
  };

  const toggleExpandedSale = (id: string) => {
    setExpandedSales((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!storeId) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-ink/60 text-sm">
        Loading store…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="font-display text-2xl text-ink">Sell</h1>
          <p className="text-sm text-ink/50 mt-0.5">
            {store?.name ?? "Store"} — point of sale
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU"
            className="w-full border border-line rounded-lg pl-9 pr-4 py-2 text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Warehouses" value={totalWarehouses} />
        <MetricCard label="Active SKUs" value={totalSkus} />
        <MetricCard
          label="Units in stock"
          value={totalUnits.toLocaleString("en-IN")}
        />
        <MetricCard
          label="Stock value"
          value={formatMoney(totalStockValue)}
          hint={lowStockCount > 0 ? `${lowStockCount} low stock` : undefined}
        />
      </div>

      {loading && (
        <div className="rounded-lg border border-line bg-paper px-4 py-8 text-center text-sm text-ink/50">
          Loading products…
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rust/20 bg-rust/5 px-4 py-3 text-sm text-rust">
          {error}
        </div>
      )}

      {!loading && warehouseStats.length === 0 && (
        <div className="rounded-lg border border-line bg-paper px-4 py-8 text-center text-sm text-ink/50">
          No products found.
        </div>
      )}

      {!loading && warehouseStats.length > 0 && (
        <section className="rounded-lg border border-line bg-paper shadow-sm overflow-hidden">
          <div className="border-b border-line">
            {/* Warehouse tabs */}
            <div className="flex items-center gap-1 px-5 pt-4 overflow-x-auto">
              {topWarehouses.map((w) => (
                <button
                  key={w.name}
                  type="button"
                  onClick={() => {
                    setActiveWarehouse(w.name);
                    setActiveShelfKey(null);
                  }}
                  className={`relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    resolvedWarehouseName === w.name
                      ? "text-ink"
                      : "text-ink/45 hover:text-ink/70"
                  }`}
                >
                  {w.name}
                  <span className="ml-1.5 text-xs text-ink/40 tabular-nums">
                    {w.totalQty}
                  </span>
                  {resolvedWarehouseName === w.name && (
                    <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent rounded-full" />
                  )}
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
                  className="ml-1 border-none bg-transparent text-sm text-ink/45 hover:text-ink/70 focus:outline-none cursor-pointer"
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

            {/* Shelf filter */}
            {shelfStats.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 px-5 py-3 bg-ink/[0.015]">
                <button
                  type="button"
                  onClick={() => setActiveShelfKey(ALL_SHELVES)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    resolvedShelfKey === ALL_SHELVES
                      ? "bg-ink text-paper"
                      : "text-ink/55 hover:bg-ink/5"
                  }`}
                >
                  All shelves
                </button>
                {topShelves.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setActiveShelfKey(s.key)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      resolvedShelfKey === s.key
                        ? "bg-ink text-paper"
                        : "text-ink/55 hover:bg-ink/5"
                    }`}
                  >
                    {s.label}
                    <span className="ml-1 opacity-70 tabular-nums">
                      {s.totalQty}
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
                    className="border-none bg-transparent text-xs text-ink/55 hover:text-ink/80 focus:outline-none cursor-pointer"
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
              <p className="text-sm text-ink/50 text-center py-8">
                No products found here.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayedProducts.map((product) => {
                  const key = cartKey(product);
                  const inCartQty = cart.get(key)?.quantity ?? 0;
                  const soldOut = product.quantity <= 0;

                  return (
                    <div
                      key={key}
                      role="button"
                      tabIndex={soldOut ? -1 : 0}
                      onClick={() => !soldOut && openSellModal(product)}
                      onKeyDown={(e) => {
                        if (!soldOut && (e.key === "Enter" || e.key === " ")) {
                          openSellModal(product);
                        }
                      }}
                      aria-disabled={soldOut}
                      className={`group relative text-left border rounded-lg p-4 bg-paper transition-all cursor-pointer ${
                        soldOut
                          ? "opacity-40 cursor-not-allowed"
                          : inCartQty > 0
                          ? "border-accent shadow-sm"
                          : "border-line hover:border-accent/50 hover:shadow-sm"
                      }`}
                    >
                      {/* Add-to-cart button, separate from the card's own click target */}
                      <button
                        type="button"
                        disabled={soldOut}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        aria-label="Add to bulk sale cart"
                        title="Add to bulk sale cart"
                        className={`absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-md text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          inCartQty > 0
                            ? "bg-accent text-paper"
                            : "bg-ink/5 text-ink/50 hover:bg-accent hover:text-paper"
                        }`}
                      >
                        {inCartQty > 0 ? inCartQty : "+"}
                      </button>

                      <div className="pr-8">
                        <span className="font-medium text-ink text-sm leading-snug">
                          {product.name}
                        </span>
                        <div className="mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${levelBadgeClass(
                              product.level
                            )}`}
                          >
                            {levelLabel(product.level)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-ink/40 truncate font-mono">
                        {product.path}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-medium tabular-nums ${
                            product.quantity <= LOW_STOCK_THRESHOLD
                              ? "bg-rust/10 text-rust"
                              : "bg-ink/5 text-ink/60"
                          }`}
                        >
                          {product.quantity} in stock
                        </span>
                        <span className="text-accent font-semibold text-sm tabular-nums">
                          {formatMoney(product.price)}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-line/70 text-xs font-medium text-ink/0 group-hover:text-accent transition-colors">
                        Tap to sell one · use + to add to bulk sale →
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recent sales */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Recent sales</h2>
          {sales.length > 0 && (
            <span className="text-xs text-ink/40">{sales.length} total</span>
          )}
        </div>

        {sales.length === 0 ? (
          <div className="rounded-lg border border-line bg-paper px-4 py-8 text-center text-sm text-ink/50">
            No sales yet — sales you record will show up here.
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-paper shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-line text-left text-ink/45 bg-ink/[0.015]">
                    <th className="px-4 py-2.5 font-medium text-xs">Products</th>
                    <th className="px-4 py-2.5 font-medium text-xs text-right">
                      Units
                    </th>
                    <th className="px-4 py-2.5 font-medium text-xs text-right">
                      Total
                    </th>
                    <th className="px-4 py-2.5 font-medium text-xs text-right">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sales.map((sale) => {
                    const isExpanded = expandedSales.has(sale.id);
                    const firstNames = sale.items
                      .slice(0, 2)
                      .map((i) => i.productName)
                      .join(", ");
                    const extraCount = sale.items.length - 2;

                    return (
                      <>
                        <tr
                          key={sale.id}
                          onClick={() => toggleExpandedSale(sale.id)}
                          className="hover:bg-ink/[0.015] transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-ink">
                              {firstNames}
                              {extraCount > 0 && (
                                <span className="text-ink/40 font-normal">
                                  {" "}
                                  +{extraCount} more
                                </span>
                              )}
                            </div>
                            <div className="text-ink/40 text-xs mt-0.5">
                              {sale.itemCount}{" "}
                              {sale.itemCount === 1 ? "item" : "items"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-ink/60 tabular-nums">
                            {sale.totalUnits}
                          </td>
                          <td className="px-4 py-3 text-right text-accent font-semibold tabular-nums">
                            {formatMoney(sale.total)}
                          </td>
                          <td className="px-4 py-3 text-right text-ink/40 text-xs whitespace-nowrap">
                            {formatTime(sale.soldAt)}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${sale.id}-detail`} className="bg-ink/[0.01]">
                            <td colSpan={4} className="px-4 py-3">
                              <div className="space-y-1.5">
                                {sale.items.map((item, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <span className="text-ink/70">
                                      {item.productName}{" "}
                                      <span className="text-ink/35">
                                        ({item.warehouseName ?? "—"})
                                      </span>
                                    </span>
                                    <span className="text-ink/50 tabular-nums">
                                      {item.quantity} × {formatMoney(item.price)} ={" "}
                                      {formatMoney(item.subtotal)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Single quick-sell modal */}
      {selected && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-20 px-4">
          <div className="bg-paper rounded-xl shadow-xl ring-1 ring-ink/5 max-w-sm w-full p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg text-ink">
                  {selected.name}
                </h3>
                <p className="text-xs text-ink/40 mt-0.5 font-mono">
                  {selected.path}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="flex items-center justify-between text-sm text-ink/60 border-y border-line py-3">
              <span>
                Available:{" "}
                <span className="font-medium text-ink tabular-nums">
                  {selected.quantity}
                </span>
              </span>
              <span className="tabular-nums">
                {formatMoney(selected.price)} / unit
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-ink/60 block mb-1.5">
                Quantity to sell
              </label>
              <QtyStepper
                value={sellQty}
                max={selected.quantity}
                onChange={setSellQty}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-ink/60 block mb-1.5">
                Sale date &amp; time
              </label>
              <input
                type="datetime-local"
                value={sellDate}
                onChange={(e) => setSellDate(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
              />
            </div>

            <div className="flex items-center justify-between text-sm bg-ink/[0.03] rounded-lg px-3.5 py-2.5">
              <span className="text-ink/60">Total</span>
              <span className="text-accent font-semibold tabular-nums">
                {formatMoney((sellQty || 0) * selected.price)}
              </span>
            </div>

            {modalError && (
              <p className="text-rust text-xs bg-rust/5 border border-rust/20 rounded-lg px-3 py-2">
                {modalError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 border border-line rounded-lg px-3 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5 transition-colors"
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

      {/* Floating bulk cart bar */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4">
          <button
            type="button"
            onClick={openCheckout}
            className="w-full flex items-center justify-between gap-4 bg-ink text-paper rounded-xl shadow-lg px-5 py-3.5 hover:opacity-90 transition-opacity"
          >
            <span className="text-sm font-medium">
              {cartCount} {cartCount === 1 ? "product" : "products"} ·{" "}
              {cartTotalUnits} units
            </span>
            <span className="text-sm font-semibold tabular-nums">
              Review sale · {formatMoney(cartTotalValue)}
            </span>
          </button>
        </div>
      )}

      {/* Bulk checkout modal */}
      {cartOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-20 px-4">
          <div className="bg-paper rounded-xl shadow-xl ring-1 ring-ink/5 max-w-lg w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg text-ink">Review sale</h3>
                <p className="text-xs text-ink/40 mt-0.5">
                  {cartCount} {cartCount === 1 ? "product" : "products"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Close"
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors"
              >
                ×
              </button>
            </div>

            {cartLines.length === 0 ? (
              <p className="text-sm text-ink/50 text-center py-6">
                Your cart is empty.
              </p>
            ) : (
              <div className="space-y-3">
                {cartLines.map((line) => {
                  const key = cartKey(line.product);
                  return (
                    <div
                      key={key}
                      className="border border-line rounded-lg p-3 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-ink text-sm truncate">
                              {line.product.name}
                            </span>
                            <span
                              className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${levelBadgeClass(
                                line.product.level
                              )}`}
                            >
                              {levelLabel(line.product.level)}
                            </span>
                          </div>
                          <p className="text-xs text-ink/40 truncate font-mono mt-0.5">
                            {line.product.warehouseName} / {line.product.path}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(key)}
                          aria-label="Remove item"
                          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-ink/40 hover:text-rust hover:bg-rust/5 transition-colors"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <QtyStepper
                          value={line.quantity}
                          max={line.product.quantity}
                          onChange={(n) => updateCartQty(key, n)}
                        />
                        <span className="text-sm font-semibold text-accent tabular-nums">
                          {formatMoney(line.quantity * line.product.price)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-ink/60 block mb-1.5">
                Sale date &amp; time
              </label>
              <input
                type="datetime-local"
                value={checkoutDate}
                onChange={(e) => setCheckoutDate(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
              />
            </div>

            <div className="flex items-center justify-between text-sm bg-ink/[0.03] rounded-lg px-3.5 py-2.5">
              <span className="text-ink/60">
                Total ({cartTotalUnits} units)
              </span>
              <span className="text-accent font-semibold tabular-nums">
                {formatMoney(cartTotalValue)}
              </span>
            </div>

            {checkoutError && (
              <p className="text-rust text-xs bg-rust/5 border border-rust/20 rounded-lg px-3 py-2">
                {checkoutError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="flex-1 border border-line rounded-lg px-3 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5 transition-colors"
              >
                Keep shopping
              </button>
              <button
                type="button"
                onClick={confirmCheckout}
                disabled={checkingOut || cartLines.length === 0}
                className="flex-1 bg-accent text-paper rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {checkingOut ? "Selling…" : "Complete sale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}