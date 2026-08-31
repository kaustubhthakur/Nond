"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Box as BoxIcon, CheckCircle2, Plus, Warehouse as WarehouseIcon } from "lucide-react";

import { getWarehouse, getWarehouses } from "@/lib/warehouseApi";
import { addProductToShelf, getShelf, sellProductFromShelf, getShelves } from "@/lib/shelfApi";
import {
  addSubShelfProduct,
  getSubShelf,
  getSubShelfProducts,
  getSubShelves,
  sellSubShelfProduct,
} from "@/lib/subshelf";
import { addBoxProduct, getBox, getBoxProducts, getBoxes, sellBoxProduct } from "@/lib/box";

import type { Warehouse } from "@/types/warehouse";
import type { Shelf } from "@/types/shelf";
import type { SubShelf } from "@/types/subshelf";
import type { Box } from "@/types/box";
import type { SearchResult } from "@/types/search";

import { Breadcrumbs, type Crumb } from "@/components/inventory/Breadcrumbs";
import { CapacityMeter } from "@/components/inventory/CapacityMeter";
import { LevelCard } from "@/components/inventory/LevelCard";
import { ProductTable, type ProductRow } from "@/components/inventory/ProductTable";
import { StockEntryModal } from "@/components/inventory/StockEntryModal";
import { StockExitModal } from "@/components/inventory/StockExitModal";
import { GlobalSearch } from "@/components/inventory/GlobalSearch";

type EntryTarget =
  | { level: "shelf"; label: string }
  | { level: "subShelf"; label: string }
  | { level: "box"; label: string };

type ExitTarget = {
  productId: string;
  name: string;
  quantity: number;
  sell: (quantity: number) => Promise<void>;
};

export default function InventoryDashboardPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const warehouseId = searchParams.get("warehouseId");
  const shelfId = searchParams.get("shelfId");
  const subShelfId = searchParams.get("subShelfId");
  const boxId = searchParams.get("boxId");

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [shelf, setShelf] = useState<Shelf | null>(null);
  const [subShelves, setSubShelves] = useState<SubShelf[]>([]);
  const [subShelf, setSubShelf] = useState<SubShelf | null>(null);
  const [subShelfProducts, setSubShelfProducts] = useState<ProductRow[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [box, setBox] = useState<Box | null>(null);
  const [boxProducts, setBoxProducts] = useState<ProductRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [entryTarget, setEntryTarget] = useState<EntryTarget | null>(null);
  const [exitTarget, setExitTarget] = useState<ExitTarget | null>(null);

  const navigate = useCallback(
    (next: {
      warehouseId?: string | null;
      shelfId?: string | null;
      subShelfId?: string | null;
      boxId?: string | null;
    }) => {
      const params = new URLSearchParams();
      const merged = { warehouseId, shelfId, subShelfId, boxId, ...next };
      if (merged.warehouseId) params.set("warehouseId", merged.warehouseId);
      if (merged.shelfId) params.set("shelfId", merged.shelfId);
      if (merged.subShelfId) params.set("subShelfId", merged.subShelfId);
      if (merged.boxId) params.set("boxId", merged.boxId);
      router.push(`/dashboard/inventory/${storeId}?${params.toString()}`);
    },
    [router, storeId, warehouseId, shelfId, subShelfId, boxId]
  );

  const flash = (message: string) => {
    setBanner(message);
    setTimeout(() => setBanner(null), 3500);
  };

  // Load data for whatever level is currently active.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (!warehouseId) {
          const { warehouses } = await getWarehouses(storeId);
          if (cancelled) return;
          setWarehouses(warehouses);
          setWarehouse(null);
          setShelf(null);
          setSubShelf(null);
          setBox(null);
          return;
        }

        const { warehouse } = await getWarehouse(storeId, warehouseId);
        if (cancelled) return;
        setWarehouse(warehouse);

        if (!shelfId) {
          const { shelves } = await getShelves(storeId, warehouseId);
          if (cancelled) return;
          setShelves(shelves);
          setShelf(null);
          setSubShelf(null);
          setBox(null);
          return;
        }

        const { shelf } = await getShelf(storeId, warehouseId, shelfId);
        if (cancelled) return;
        setShelf(shelf);

        if (!subShelfId) {
          const { subShelves } = await getSubShelves(storeId, warehouseId, shelfId);
          if (cancelled) return;
          setSubShelves(subShelves);
          setSubShelf(null);
          setBox(null);
          return;
        }

        const { subShelf } = await getSubShelf(storeId, warehouseId, shelfId, subShelfId);
        if (cancelled) return;
        setSubShelf(subShelf);

        const [{ boxes }, { products }] = await Promise.all([
          getBoxes(storeId, warehouseId, shelfId, subShelfId),
          getSubShelfProducts(storeId, warehouseId, shelfId, subShelfId),
        ]);
        if (cancelled) return;
        setBoxes(boxes);
        setSubShelfProducts(
          products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, quantity: p.quantity }))
        );

        if (!boxId) {
          setBox(null);
          return;
        }

        const [{ box }, { products: boxProducts }] = await Promise.all([
          getBox(storeId, warehouseId, shelfId, subShelfId, boxId),
          getBoxProducts(storeId, warehouseId, shelfId, subShelfId, boxId),
        ]);
        if (cancelled) return;
        setBox(box);
        setBoxProducts(
          boxProducts.map((p) => ({ id: p.id, name: p.name, sku: p.sku, quantity: p.quantity }))
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load inventory.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [storeId, warehouseId, shelfId, subShelfId, boxId, refreshKey]);

  const trail: Crumb[] = useMemo(() => {
    const items: Crumb[] = [
      {
        label: "Inventory",
        onClick: () => navigate({ warehouseId: null, shelfId: null, subShelfId: null, boxId: null }),
      },
    ];
    if (warehouse) {
      items.push({ label: warehouse.name, onClick: () => navigate({ shelfId: null, subShelfId: null, boxId: null }) });
    }
    if (shelf) {
      items.push({ label: shelf.name, onClick: () => navigate({ subShelfId: null, boxId: null }) });
    }
    if (subShelf) {
      items.push({ label: subShelf.name, onClick: () => navigate({ boxId: null }) });
    }
    if (box) {
      items.push({ label: box.name });
    }
    return items;
  }, [warehouse, shelf, subShelf, box, navigate]);

  // ---- entry (add stock) ----

  const submitEntry = async (payload: { name: string; sku?: string; quantity: number }) => {
    if (!entryTarget) return;
    if (entryTarget.level === "shelf" && warehouseId && shelfId) {
      await addProductToShelf(storeId, warehouseId, shelfId, payload);
    } else if (entryTarget.level === "subShelf" && warehouseId && shelfId && subShelfId) {
      await addSubShelfProduct(storeId, warehouseId, shelfId, subShelfId, payload);
    } else if (entryTarget.level === "box" && warehouseId && shelfId && subShelfId && boxId) {
      await addBoxProduct(storeId, warehouseId, shelfId, subShelfId, boxId, payload);
    }
    flash(`Added ${payload.quantity} × "${payload.name}".`);
    setRefreshKey((k) => k + 1);
  };

  // ---- exit (sell / remove stock) ----

  const openExitForRow = (row: ProductRow, sell: (quantity: number) => Promise<void>) => {
    setExitTarget({ productId: row.id, name: row.name, quantity: row.quantity, sell });
  };

  const openExitForSearchResult = (result: SearchResult) => {
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
        await sellSubShelfProduct(storeId, location.warehouseId, location.shelfId!, location.subShelfId!, result.product.id, qty);
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
    setRefreshKey((k) => k + 1);
  };

  // Capacity shown in the header: product fill for shelf/sub-shelf/box,
  // shelf-slot usage for a warehouse (warehouses don't hold products directly).
  const headerUsed = box
    ? box.productQuantity
    : subShelf
    ? subShelf.productQuantity
    : shelf
    ? shelf.productQuantity
    : warehouse
    ? shelves.length
    : 0;

  const headerTotal = box
    ? box.capacity
    : subShelf
    ? subShelf.capacity
    : shelf
    ? shelf.capacity
    : warehouse
    ? warehouse.shelfCapacity
    : 0;

  const headerLabel = warehouse && !shelf ? "Shelves used" : "Capacity";

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Inventory</p>
            <Breadcrumbs trail={trail} />
          </div>
          <GlobalSearch storeId={storeId} onSell={openExitForSearchResult} />
        </div>

        {(warehouse || shelf || subShelf || box) && (
          <div className="ledger-card flex flex-wrap items-center justify-between gap-6 px-6 py-4">
            <div>
              <h1 className="font-display text-2xl text-ink">
                {box?.name ?? subShelf?.name ?? shelf?.name ?? warehouse?.name}
              </h1>
              {(box ?? subShelf ?? shelf)?.description && (
                <p className="mt-1 text-sm text-ink/50">{(box ?? subShelf ?? shelf)?.description}</p>
              )}
            </div>
            <div className="w-48">
              <CapacityMeter used={headerUsed} total={headerTotal} label={headerLabel} />
            </div>
          </div>
        )}
      </header>

      {banner && (
        <div className="mb-6 flex items-center gap-2 rounded-full bg-emerald-700/10 px-4 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          {banner}
        </div>
      )}

      {error && <p className="mb-6 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="font-mono text-sm text-ink/50">Loading…</p>
      ) : (
        <div className="space-y-8">
          {/* Level: warehouses */}
          {!warehouseId && (
            <section>
              {warehouses.length === 0 ? (
                <EmptyState icon={<WarehouseIcon className="h-5 w-5" />} text="No warehouses yet." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {warehouses.map((w) => (
                    <LevelCard
                      key={w.id}
                      title={w.name}
                      subtitle={w.description ?? undefined}
                      onOpen={() => navigate({ warehouseId: w.id })}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Level: shelves */}
          {warehouseId && !shelfId && (
            <section className="space-y-4">
              <SectionHeading title="Shelves" />
              {shelves.length === 0 ? (
                <EmptyState text="No shelves in this warehouse yet." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {shelves.map((s) => (
                    <LevelCard
                      key={s.id}
                      title={s.name}
                      subtitle={s.description ?? undefined}
                      used={s.productQuantity}
                      total={s.capacity}
                      onOpen={() => navigate({ shelfId: s.id })}
                      onQuickAdd={() => setEntryTarget({ level: "shelf", label: s.name })}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Level: sub-shelves */}
          {shelfId && !subShelfId && (
            <section className="space-y-8">
              <div>
                <SectionHeading
                  title="Sub-shelves"
                  action={{
                    label: "Add stock to shelf",
                    onClick: () => setEntryTarget({ level: "shelf", label: shelf?.name ?? "Shelf" }),
                  }}
                />
                {subShelves.length === 0 ? (
                  <EmptyState text="No sub-shelves on this shelf yet." />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {subShelves.map((ss) => (
                      <LevelCard
                        key={ss.id}
                        title={ss.name}
                        subtitle={ss.description ?? undefined}
                        used={ss.productQuantity}
                        total={ss.capacity}
                        onOpen={() => navigate({ subShelfId: ss.id })}
                        onQuickAdd={() => setEntryTarget({ level: "subShelf", label: ss.name })}
                      />
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-ink/40">
                Products placed directly on a shelf aren&rsquo;t individually listed here
                yet — use search above to find and remove one.
              </p>
            </section>
          )}

          {/* Level: boxes + sub-shelf products */}
          {subShelfId && !boxId && (
            <section className="space-y-8">
              <div className="space-y-4">
                <SectionHeading
                  title="Products on this sub-shelf"
                  action={{
                    label: "Add stock",
                    onClick: () => setEntryTarget({ level: "subShelf", label: subShelf?.name ?? "Sub-shelf" }),
                  }}
                />
                <ProductTable
                  products={subShelfProducts}
                  onSell={(row) =>
                    openExitForRow(row, async (qty) => {
                      await sellSubShelfProduct(storeId, warehouseId!, shelfId!, subShelfId!, row.id, qty);
                    })
                  }
                  emptyHint="No products placed directly on this sub-shelf."
                />
              </div>

              <div className="space-y-4">
                <SectionHeading title="Boxes" />
                {boxes.length === 0 ? (
                  <EmptyState icon={<BoxIcon className="h-5 w-5" />} text="No boxes on this sub-shelf yet." />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {boxes.map((b) => (
                      <LevelCard
                        key={b.id}
                        title={b.name}
                        subtitle={b.description ?? undefined}
                        used={b.productQuantity}
                        total={b.capacity}
                        onOpen={() => navigate({ boxId: b.id })}
                        onQuickAdd={() => setEntryTarget({ level: "box", label: b.name })}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Level: products in a box */}
          {boxId && (
            <section className="space-y-4">
              <SectionHeading
                title="Products in this box"
                action={{ label: "Add stock", onClick: () => setEntryTarget({ level: "box", label: box?.name ?? "Box" }) }}
              />
              <ProductTable
                products={boxProducts}
                onSell={(row) =>
                  openExitForRow(row, async (qty) => {
                    await sellBoxProduct(storeId, warehouseId!, shelfId!, subShelfId!, boxId!, row.id, qty);
                  })
                }
                emptyHint="No products in this box yet."
              />
            </section>
          )}
        </div>
      )}

      <StockEntryModal
        open={entryTarget !== null}
        targetLabel={entryTarget?.label ?? ""}
        onClose={() => setEntryTarget(null)}
        onSubmit={submitEntry}
      />

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

function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-display text-lg text-ink">{title}</h2>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-1.5 text-xs text-ink/70 hover:border-ink/30 hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" />
          {action.label}
        </button>
      )}
    </div>
  );
}

function EmptyState({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div className="ledger-card flex flex-col items-center gap-2 px-6 py-10 text-center text-ink/50">
      {icon}
      <p className="text-sm">{text}</p>
    </div>
  );
}