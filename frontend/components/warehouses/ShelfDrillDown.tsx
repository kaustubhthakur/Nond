"use client";

import { useEffect, useState } from "react";
import { Shelf } from "@/types/shelf";
import {
  getSubShelves,
  createSubShelf,
  addProductToSubShelf,
  deleteSubShelf,
  getSubShelfProducts,
} from "@/lib/subshelf";
import type { SubShelf, CreateSubShelfPayload, SubShelfProduct } from "@/types/subshelf";
import {
  getBoxes,
  createBox,
  addProductToBox,
  deleteBox,
  getBoxProducts,
} from "@/lib/box";
import type { Box, CreateBoxPayload, BoxProduct } from "@/types/box";
import { shelfApi } from "@/lib/shelfApi";
import { DonutChart, capacitySegments } from "./DonutChart";
import { AddProductModal } from "./AddProductModal";
import { AddSubShelfModal } from "./AddSubShelfModal";
import { AddBoxModal } from "./AddBoxModal";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AddProductPayload {
  productId: string;
  quantity: number;
}

interface ShelfDrilldownProps {
  shelf: Shelf | null;
  onClose: () => void;
  onDeleteShelf?: (shelf: Shelf) => Promise<void>;
  onShelfChanged?: (shelf: Shelf) => void;
}

const PIE_COLORS = [
  "#4b6a52", // accent
  "#a5613f", // rust
  "#8c9c8f",
  "#c9a26a",
  "#6b7f8f",
  "#b98c7a",
  "#7a8c6b",
  "#9a7fa8",
];

function StatusPill({ full }: { full: boolean }) {
  return (
    <span
      className={`eyebrow text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap ${
        full ? "bg-rust/10 text-rust" : "bg-accent/10 text-accent"
      }`}
    >
      {full ? "Full" : "Open"}
    </span>
  );
}

function NodeCard({
  name,
  used,
  capacity,
  metaLabel,
  onOpen,
  onDelete,
}: {
  name: string;
  used: number;
  capacity: number;
  metaLabel: string;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const full = capacity > 0 ? used >= capacity : false;
  const segments = capacitySegments(used, capacity, full);
  return (
    <div className="rounded-lg border border-line bg-paper hover:border-accent/40 hover:shadow-sm transition-all duration-200 p-3.5 flex items-center gap-3">
      <button type="button" onClick={onOpen} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <DonutChart segments={segments} size={44} thickness={5} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-display italic text-sm text-ink truncate">{name}</p>
            <StatusPill full={full} />
          </div>
          <p className="text-[11px] text-ink/45 font-mono">
            {used} / {capacity} · {metaLabel}
          </p>
        </div>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="eyebrow text-[10px] text-ink/30 hover:text-rust transition-colors shrink-0"
      >
        Delete
      </button>
    </div>
  );
}

/** Pie chart of product quantities for the current sub-shelf/box. */
function ProductBreakdownChart({
  products,
  loading,
  error,
}: {
  products: { name: string; quantity: number }[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return <p className="text-xs text-ink/50">Loading product breakdown…</p>;
  }
  if (error) {
    return <p className="text-xs text-rust">{error}</p>;
  }
  if (products.length === 0) {
    return <p className="text-xs text-ink/50">No products logged here yet.</p>;
  }

  const data = products.map((p) => ({ name: p.name, value: p.quantity }));

  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value} units`, name]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ fontSize: 11, lineHeight: "18px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type Level =
  | { kind: "shelf" }
  | { kind: "subshelf"; subShelf: SubShelf }
  | { kind: "box"; subShelf: SubShelf; box: Box };

/**
 * Full-page drilldown that chains shelf → sub-shelf → box navigation.
 * Mount once per page and control it by passing the currently-open `shelf`
 * (or `null` to keep it closed).
 */
export function ShelfDrilldown({ shelf, onClose, onDeleteShelf, onShelfChanged }: ShelfDrilldownProps) {
  const open = !!shelf;
  const [visible, setVisible] = useState(false);
  const [level, setLevel] = useState<Level>({ kind: "shelf" });

  const [subShelves, setSubShelves] = useState<SubShelf[]>([]);
  const [loadingSubShelves, setLoadingSubShelves] = useState(false);
  const [subShelfError, setSubShelfError] = useState<string | null>(null);

  const [boxesBySubShelf, setBoxesBySubShelf] = useState<Record<string, Box[]>>({});
  const [loadingBoxes, setLoadingBoxes] = useState(false);
  const [boxError, setBoxError] = useState<string | null>(null);

  // Per-product breakdowns, keyed by sub-shelf id / box id, for the pie charts.
  const [subShelfProducts, setSubShelfProducts] = useState<Record<string, SubShelfProduct[]>>({});
  const [loadingSubShelfProducts, setLoadingSubShelfProducts] = useState(false);
  const [subShelfProductsError, setSubShelfProductsError] = useState<string | null>(null);

  const [boxProducts, setBoxProducts] = useState<Record<string, BoxProduct[]>>({});
  const [loadingBoxProducts, setLoadingBoxProducts] = useState(false);
  const [boxProductsError, setBoxProductsError] = useState<string | null>(null);

  const [showSubShelfModal, setShowSubShelfModal] = useState(false);
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  const [deletingShelf, setDeletingShelf] = useState(false);

  useEffect(() => {
    if (open) {
      setLevel({ kind: "shelf" });
      setBoxesBySubShelf({});
      setSubShelfProducts({});
      setBoxProducts({});
      requestAnimationFrame(() => setVisible(true));
      if (shelf) loadSubShelves(shelf);
    } else {
      setVisible(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shelf?.id]);

  const loadSubShelves = async (s: Shelf) => {
    setLoadingSubShelves(true);
    setSubShelfError(null);
    try {
      const { subShelves } = await getSubShelves(s.storeId, s.warehouseId, s.id);
      setSubShelves(subShelves);
    } catch (err) {
      setSubShelfError(err instanceof Error ? err.message : "Could not load sub-shelves.");
    } finally {
      setLoadingSubShelves(false);
    }
  };

  const loadBoxes = async (subShelfId: string) => {
    if (!shelf) return;
    setLoadingBoxes(true);
    setBoxError(null);
    try {
      const { boxes } = await getBoxes(shelf.storeId, shelf.warehouseId, shelf.id, subShelfId);
      setBoxesBySubShelf((prev) => ({ ...prev, [subShelfId]: boxes }));
    } catch (err) {
      setBoxError(err instanceof Error ? err.message : "Could not load boxes.");
    } finally {
      setLoadingBoxes(false);
    }
  };

  const loadSubShelfProducts = async (subShelfId: string) => {
    if (!shelf) return;
    setLoadingSubShelfProducts(true);
    setSubShelfProductsError(null);
    try {
      const { products } = await getSubShelfProducts(shelf.storeId, shelf.warehouseId, shelf.id, subShelfId);
      setSubShelfProducts((prev) => ({ ...prev, [subShelfId]: products }));
    } catch (err) {
      setSubShelfProductsError(err instanceof Error ? err.message : "Could not load products.");
    } finally {
      setLoadingSubShelfProducts(false);
    }
  };

  const loadBoxProducts = async (subShelfId: string, boxId: string) => {
    if (!shelf) return;
    setLoadingBoxProducts(true);
    setBoxProductsError(null);
    try {
      const { products } = await getBoxProducts(shelf.storeId, shelf.warehouseId, shelf.id, subShelfId, boxId);
      setBoxProducts((prev) => ({ ...prev, [boxId]: products }));
    } catch (err) {
      setBoxProductsError(err instanceof Error ? err.message : "Could not load products.");
    } finally {
      setLoadingBoxProducts(false);
    }
  };

  if (!shelf) return null;

  const goShelf = () => setLevel({ kind: "shelf" });
  const goSubShelf = (subShelf: SubShelf) => {
    setLevel({ kind: "subshelf", subShelf });
    if (!boxesBySubShelf[subShelf.id]) loadBoxes(subShelf.id);
    if (!subShelfProducts[subShelf.id]) loadSubShelfProducts(subShelf.id);
  };
  const goBox = (subShelf: SubShelf, box: Box) => {
    setLevel({ kind: "box", subShelf, box });
    if (!boxProducts[box.id]) loadBoxProducts(subShelf.id, box.id);
  };

  const handleCreateSubShelf = async (payload: CreateSubShelfPayload) => {
    await createSubShelf(shelf.storeId, shelf.warehouseId, shelf.id, payload);
    setShowSubShelfModal(false);
    await loadSubShelves(shelf);
    onShelfChanged?.(shelf);
  };

  const handleDeleteSubShelf = async (subShelfId: string) => {
    try {
      await deleteSubShelf(shelf.storeId, shelf.warehouseId, shelf.id, subShelfId);
      await loadSubShelves(shelf);
      onShelfChanged?.(shelf);
      if (level.kind !== "shelf" && level.subShelf.id === subShelfId) goShelf();
    } catch (err) {
      setSubShelfError(err instanceof Error ? err.message : "Could not delete sub-shelf.");
    }
  };

  const handleCreateBox = async (payload: CreateBoxPayload) => {
    if (level.kind !== "subshelf") return;
    await createBox(shelf.storeId, shelf.warehouseId, shelf.id, level.subShelf.id, payload);
    setShowBoxModal(false);
    await loadBoxes(level.subShelf.id);
    await loadSubShelves(shelf);
    onShelfChanged?.(shelf);
  };

  const handleDeleteBox = async (subShelfId: string, boxId: string) => {
    try {
      await deleteBox(shelf.storeId, shelf.warehouseId, shelf.id, subShelfId, boxId);
      await loadBoxes(subShelfId);
      await loadSubShelves(shelf);
      onShelfChanged?.(shelf);
      if (level.kind === "box" && level.box.id === boxId) {
        setLevel({ kind: "subshelf", subShelf: level.subShelf });
      }
    } catch (err) {
      setBoxError(err instanceof Error ? err.message : "Could not delete box.");
    }
  };

  const handleAddProduct = async (payload: AddProductPayload) => {
    if (level.kind === "shelf") {
      await shelfApi.addProduct(shelf.storeId, shelf.warehouseId, shelf.id, payload);
      await loadSubShelves(shelf);
    } else if (level.kind === "subshelf") {
      await addProductToSubShelf(shelf.storeId, shelf.warehouseId, shelf.id, level.subShelf.id, payload);
      await loadSubShelves(shelf);
      await loadSubShelfProducts(level.subShelf.id);
    } else if (level.kind === "box") {
      await addProductToBox(shelf.storeId, shelf.warehouseId, shelf.id, level.subShelf.id, level.box.id, payload);
      await loadBoxes(level.subShelf.id);
      await loadSubShelves(shelf);
      await loadBoxProducts(level.subShelf.id, level.box.id);
    }
    setShowProductModal(false);
    onShelfChanged?.(shelf);
  };

  const handleDeleteShelf = async () => {
    if (!onDeleteShelf) return;
    setDeletingShelf(true);
    try {
      await onDeleteShelf(shelf);
      onClose();
    } finally {
      setDeletingShelf(false);
    }
  };

  const shelfFull = shelf.availableCapacity <= 0;

  let headerName = shelf.name;
  let headerUsed = shelf.productQuantity;
  let headerCapacity = shelf.capacity;
  let headerFull = shelfFull;
  let headerMeta = `up to ${shelf.maxSubShelves} sub-shelves`;
  let availableCapacityForModal = shelf.availableCapacity;

  if (level.kind === "subshelf") {
    headerName = level.subShelf.name;
    headerUsed = level.subShelf.productQuantity;
    headerCapacity = level.subShelf.capacity;
    headerFull = level.subShelf.availableCapacity <= 0;
    headerMeta = `up to ${level.subShelf.maxBoxes} boxes`;
    availableCapacityForModal = level.subShelf.availableCapacity;
  } else if (level.kind === "box") {
    headerName = level.box.name;
    headerUsed = level.box.productQuantity;
    headerCapacity = level.box.capacity;
    headerFull = level.box.availableCapacity <= 0;
    headerMeta = "box";
    availableCapacityForModal = level.box.availableCapacity;
  }

  const headerSegments = capacitySegments(headerUsed, headerCapacity, headerFull);

  return (
    <div
      className={`fixed inset-0 z-30 bg-paper flex flex-col transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Header / breadcrumb */}
      <div className="px-6 pt-5 pb-3 border-b border-line flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 overflow-hidden max-w-3xl w-full mx-auto">
          <button
            type="button"
            onClick={onClose}
            className="eyebrow text-xs text-ink/50 hover:text-accent transition-colors shrink-0"
          >
            ← Back
          </button>
          <span className="text-ink/20">|</span>
          <div className="flex items-center gap-1.5 text-xs min-w-0 overflow-hidden">
            <button
              type="button"
              onClick={goShelf}
              className={`eyebrow truncate ${level.kind === "shelf" ? "text-ink" : "text-ink/40 hover:text-accent"}`}
            >
              {shelf.name}
            </button>
            {level.kind !== "shelf" && (
              <>
                <span className="text-ink/25">/</span>
                <button
                  type="button"
                  onClick={() => goSubShelf(level.subShelf)}
                  className={`eyebrow truncate ${
                    level.kind === "subshelf" ? "text-ink" : "text-ink/40 hover:text-accent"
                  }`}
                >
                  {level.subShelf.name}
                </button>
              </>
            )}
            {level.kind === "box" && (
              <>
                <span className="text-ink/25">/</span>
                <span className="eyebrow truncate text-ink">{level.box.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6 max-w-3xl w-full mx-auto">
        {/* Header summary for the current level */}
        <div className="flex items-center gap-4">
          <DonutChart segments={headerSegments} size={72} thickness={9} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display italic text-xl text-ink tracking-wide truncate">{headerName}</h2>
              <StatusPill full={headerFull} />
            </div>
            <p className="text-xs text-ink/50 font-mono mt-0.5">
              {headerUsed.toLocaleString()} / {headerCapacity.toLocaleString()} units · {headerMeta}
            </p>
          </div>
        </div>

        {/* Contextual toolbar */}
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowProductModal(true)}
            disabled={availableCapacityForModal <= 0}
            className="eyebrow rounded-lg border border-ink/15 px-3 py-2 text-xs text-ink/70 hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
          >
            {availableCapacityForModal <= 0 ? "Full" : "+ Add product"}
          </button>

          {level.kind === "shelf" && (
            <>
              <button
                type="button"
                onClick={() => setShowSubShelfModal(true)}
                className="eyebrow rounded-lg border border-ink/15 px-3 py-2 text-xs text-ink/70 hover:border-accent hover:text-accent transition-colors"
              >
                + Add sub-shelf
              </button>
              {onDeleteShelf && (
                <button
                  type="button"
                  onClick={handleDeleteShelf}
                  disabled={deletingShelf}
                  className="eyebrow rounded-lg border border-ink/15 px-3 py-2 text-xs text-ink/50 hover:border-rust hover:text-rust transition-colors ml-auto disabled:opacity-50"
                >
                  {deletingShelf ? "Deleting…" : "Delete shelf"}
                </button>
              )}
            </>
          )}

          {level.kind === "subshelf" && (
            <>
              <button
                type="button"
                onClick={() => setShowBoxModal(true)}
                className="eyebrow rounded-lg border border-ink/15 px-3 py-2 text-xs text-ink/70 hover:border-accent hover:text-accent transition-colors"
              >
                + Add box
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSubShelf(level.subShelf.id)}
                className="eyebrow rounded-lg border border-ink/15 px-3 py-2 text-xs text-ink/50 hover:border-rust hover:text-rust transition-colors ml-auto"
              >
                Delete sub-shelf
              </button>
            </>
          )}

          {level.kind === "box" && (
            <button
              type="button"
              onClick={() => handleDeleteBox(level.subShelf.id, level.box.id)}
              className="eyebrow rounded-lg border border-ink/15 px-3 py-2 text-xs text-ink/50 hover:border-rust hover:text-rust transition-colors ml-auto"
            >
              Delete box
            </button>
          )}
        </div>

        {/* Product breakdown pie chart — sub-shelf and box levels only */}
        {level.kind === "subshelf" && (
          <div className="flex flex-col gap-2.5">
            <p className="eyebrow text-[10px] text-ink/40">Product breakdown</p>
            <ProductBreakdownChart
              products={subShelfProducts[level.subShelf.id] ?? []}
              loading={loadingSubShelfProducts && !subShelfProducts[level.subShelf.id]}
              error={subShelfProductsError}
            />
          </div>
        )}

        {level.kind === "box" && (
          <div className="flex flex-col gap-2.5">
            <p className="eyebrow text-[10px] text-ink/40">Product breakdown</p>
            <ProductBreakdownChart
              products={boxProducts[level.box.id] ?? []}
              loading={loadingBoxProducts && !boxProducts[level.box.id]}
              error={boxProductsError}
            />
          </div>
        )}

        {/* Chained children list */}
        {level.kind === "shelf" && (
          <div className="flex flex-col gap-2.5">
            <p className="eyebrow text-[10px] text-ink/40">Sub-shelves</p>
            {subShelfError && <p className="text-xs text-rust">{subShelfError}</p>}
            {loadingSubShelves ? (
              <p className="text-xs text-ink/50">Loading sub-shelves…</p>
            ) : subShelves.length === 0 ? (
              <p className="text-xs text-ink/50">No sub-shelves yet.</p>
            ) : (
              subShelves.map((s) => (
                <NodeCard
                  key={s.id}
                  name={s.name}
                  used={s.productQuantity}
                  capacity={s.capacity}
                  metaLabel={`up to ${s.maxBoxes} boxes`}
                  onOpen={() => goSubShelf(s)}
                  onDelete={() => handleDeleteSubShelf(s.id)}
                />
              ))
            )}
          </div>
        )}

        {level.kind === "subshelf" && (
          <div className="flex flex-col gap-2.5">
            <p className="eyebrow text-[10px] text-ink/40">Boxes</p>
            {boxError && <p className="text-xs text-rust">{boxError}</p>}
            {loadingBoxes && !boxesBySubShelf[level.subShelf.id] ? (
              <p className="text-xs text-ink/50">Loading boxes…</p>
            ) : (boxesBySubShelf[level.subShelf.id] ?? []).length === 0 ? (
              <p className="text-xs text-ink/50">No boxes yet.</p>
            ) : (
              (boxesBySubShelf[level.subShelf.id] ?? []).map((b) => (
                <NodeCard
                  key={b.id}
                  name={b.name}
                  used={b.productQuantity}
                  capacity={b.capacity}
                  metaLabel="box"
                  onOpen={() => goBox(level.subShelf, b)}
                  onDelete={() => handleDeleteBox(level.subShelf.id, b.id)}
                />
              ))
            )}
          </div>
        )}

        {level.kind === "box" && (
          <div className="flex flex-col gap-2">
            <p className="eyebrow text-[10px] text-ink/40">Products in this box</p>
            {(boxProducts[level.box.id] ?? []).length === 0 && !loadingBoxProducts ? (
              <p className="text-xs text-ink/50">No products logged yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-line/60 border border-line rounded-lg overflow-hidden">
                {(boxProducts[level.box.id] ?? []).map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="text-ink truncate">{p.name}</p>
                      {p.sku ? <p className="text-[11px] text-ink/40 font-mono">{p.sku}</p> : null}
                    </div>
                    <span className="text-xs font-mono text-ink/60 shrink-0">{p.quantity} units</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showSubShelfModal && (
        <AddSubShelfModal
          shelfName={shelf.name}
          availableCapacity={shelf.availableCapacity}
          onClose={() => setShowSubShelfModal(false)}
          onAdd={handleCreateSubShelf}
        />
      )}

      {showBoxModal && level.kind === "subshelf" && (
        <AddBoxModal
          subShelfName={level.subShelf.name}
          availableCapacity={level.subShelf.availableCapacity}
          onClose={() => setShowBoxModal(false)}
          onAdd={handleCreateBox}
        />
      )}

      {showProductModal && (
        <AddProductModal
          shelfName={headerName}
          availableCapacity={availableCapacityForModal}
          onClose={() => setShowProductModal(false)}
          onAdd={handleAddProduct}
        />
      )}
    </div>
  );
}