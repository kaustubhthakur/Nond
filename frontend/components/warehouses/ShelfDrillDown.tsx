"use client";

import { useEffect, useState } from "react";
import { Shelf } from "@/types/shelf";
import {
  getSubShelves,
  createSubShelf,
  addProductToSubShelf,
  deleteSubShelf,
} from "@/lib/subshelf";
import type { SubShelf } from "@/types/subshelf";
import {
  getBoxes,
  createBox,
  addProductToBox,
  deleteBox,
} from "@/lib/box";
import type { Box } from "@/types/box";
import { DonutChart, capacitySegments } from "./DonutChart";

interface ShelfDrilldownProps {
  shelf: Shelf | null;
  onClose: () => void;
  onDeleteShelf?: (shelf: Shelf) => Promise<void>;
  onShelfChanged?: (shelf: Shelf) => void;
}

function StatusPill({ full }: { full: boolean }) {
  return (
    <span
      className={`eyebrow text-[10px] px-2 py-0.5 rounded-full ${
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

type Level =
  | { kind: "shelf" }
  | { kind: "subshelf"; subShelf: SubShelf }
  | { kind: "box"; subShelf: SubShelf; box: Box };

/**
 * Slide-over panel that chains shelf → sub-shelf → box navigation.
 * Mount once per page (e.g. next to your shelf grid) and control it by
 * passing the currently-open `shelf` (or `null` to keep it closed).
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

  const [creating, setCreating] = useState<"subshelf" | "box" | null>(null);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const [productModal, setProductModal] = useState(false);
  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productQty, setProductQty] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);

  const [deletingShelf, setDeletingShelf] = useState(false);

  useEffect(() => {
    if (open) {
      setLevel({ kind: "shelf" });
      setBoxesBySubShelf({});
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

  if (!shelf) return null;

  const goShelf = () => setLevel({ kind: "shelf" });
  const goSubShelf = (subShelf: SubShelf) => {
    setLevel({ kind: "subshelf", subShelf });
    if (!boxesBySubShelf[subShelf.id]) loadBoxes(subShelf.id);
  };
  const goBox = (subShelf: SubShelf, box: Box) => setLevel({ kind: "box", subShelf, box });

  const handleCreateSubShelf = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createSubShelf(shelf.storeId, shelf.warehouseId, shelf.id, { name: newName.trim() });
      setNewName("");
      setCreating(null);
      await loadSubShelves(shelf);
      onShelfChanged?.(shelf);
    } catch (err) {
      setSubShelfError(err instanceof Error ? err.message : "Could not create sub-shelf.");
    } finally {
      setSaving(false);
    }
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

  const handleCreateBox = async (subShelfId: string) => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createBox(shelf.storeId, shelf.warehouseId, shelf.id, subShelfId, { name: newName.trim() });
      setNewName("");
      setCreating(null);
      await loadBoxes(subShelfId);
    } catch (err) {
      setBoxError(err instanceof Error ? err.message : "Could not create box.");
    } finally {
      setSaving(false);
    }
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

  const handleAddProduct = async () => {
    if (!productName.trim() || !productQty) return;
    setSavingProduct(true);
    try {
      if (level.kind === "subshelf") {
        await addProductToSubShelf(shelf.storeId, shelf.warehouseId, shelf.id, level.subShelf.id, {
          name: productName.trim(),
          sku: productSku.trim() || undefined,
          quantity: parseInt(productQty, 10),
        });
        await loadSubShelves(shelf);
      } else if (level.kind === "box") {
        await addProductToBox(shelf.storeId, shelf.warehouseId, shelf.id, level.subShelf.id, level.box.id, {
          name: productName.trim(),
          sku: productSku.trim() || undefined,
          quantity: parseInt(productQty, 10),
        });
        await loadBoxes(level.subShelf.id);
        await loadSubShelves(shelf);
      }
      setProductModal(false);
      setProductName("");
      setProductSku("");
      setProductQty("");
      onShelfChanged?.(shelf);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not add product.";
      if (level.kind === "subshelf") setSubShelfError(msg);
      else setBoxError(msg);
    } finally {
      setSavingProduct(false);
    }
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

  if (level.kind === "subshelf") {
    headerName = level.subShelf.name;
    headerUsed = level.subShelf.productQuantity;
    headerCapacity = level.subShelf.capacity;
    headerFull = level.subShelf.availableCapacity <= 0;
    headerMeta = `up to ${level.subShelf.maxBoxes} boxes`;
  } else if (level.kind === "box") {
    headerName = level.box.name;
    headerUsed = level.box.productQuantity;
    headerCapacity = level.box.capacity;
    headerFull = level.box.availableCapacity <= 0;
    headerMeta = "box";
  }

  const headerSegments = capacitySegments(headerUsed, headerCapacity, headerFull);

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`relative h-full w-full max-w-lg bg-paper shadow-xl flex flex-col transition-transform duration-300 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Breadcrumb */}
        <div className="px-6 pt-5 pb-3 border-b border-line flex items-center justify-between gap-3">
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
          <button type="button" onClick={onClose} className="text-ink/40 hover:text-ink text-lg leading-none shrink-0">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
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
            {level.kind === "shelf" && (
              <>
                <button
                  type="button"
                  onClick={() => setCreating("subshelf")}
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
                  onClick={() => setProductModal(true)}
                  disabled={level.subShelf.availableCapacity <= 0}
                  className="eyebrow rounded-lg border border-ink/15 px-3 py-2 text-xs text-ink/70 hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
                >
                  + Add product
                </button>
                <button
                  type="button"
                  onClick={() => setCreating("box")}
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
              <>
                <button
                  type="button"
                  onClick={() => setProductModal(true)}
                  disabled={level.box.availableCapacity <= 0}
                  className="eyebrow rounded-lg border border-ink/15 px-3 py-2 text-xs text-ink/70 hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
                >
                  + Add product
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBox(level.subShelf.id, level.box.id)}
                  className="eyebrow rounded-lg border border-ink/15 px-3 py-2 text-xs text-ink/50 hover:border-rust hover:text-rust transition-colors ml-auto"
                >
                  Delete box
                </button>
              </>
            )}
          </div>

          {creating === "subshelf" && (
            <div className="rounded-lg border border-line bg-ink/[0.02] p-3 flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Sub-shelf name"
                className="flex-1 border-b border-line bg-transparent py-1.5 text-sm focus:outline-none focus:border-accent"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateSubShelf}
                disabled={saving}
                className="eyebrow rounded-lg bg-accent px-3 py-1.5 text-paper hover:bg-accent-dim transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Create"}
              </button>
              <button type="button" onClick={() => setCreating(null)} className="eyebrow text-ink/50 hover:text-ink px-2">
                Cancel
              </button>
            </div>
          )}

          {creating === "box" && level.kind === "subshelf" && (
            <div className="rounded-lg border border-line bg-ink/[0.02] p-3 flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Box name"
                className="flex-1 border-b border-line bg-transparent py-1.5 text-sm focus:outline-none focus:border-accent"
                autoFocus
              />
              <button
                type="button"
                onClick={() => handleCreateBox(level.subShelf.id)}
                disabled={saving}
                className="eyebrow rounded-lg bg-accent px-3 py-1.5 text-paper hover:bg-accent-dim transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Create"}
              </button>
              <button type="button" onClick={() => setCreating(null)} className="eyebrow text-ink/50 hover:text-ink px-2">
                Cancel
              </button>
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
              <p className="eyebrow text-[10px] text-ink/40">This box</p>
              <p className="text-xs text-ink/50 leading-relaxed">
                Use “+ Add product” above to log what's inside. A per-item product list will render
                here once the box API returns individual product entries (name, SKU, quantity) rather
                than just the aggregate count.
              </p>
            </div>
          )}
        </div>
      </div>

      {productModal && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-40 px-4">
          <div className="rounded-xl border border-line bg-paper p-6 w-full max-w-sm shadow-lg">
            <h3 className="font-display text-lg text-ink mb-4">Add product</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Product name"
                className="w-full border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:border-accent"
                autoFocus
              />
              <input
                type="text"
                value={productSku}
                onChange={(e) => setProductSku(e.target.value)}
                placeholder="SKU (optional)"
                className="w-full border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:border-accent"
              />
              <input
                type="number"
                min={1}
                value={productQty}
                onChange={(e) => setProductQty(e.target.value)}
                placeholder="Quantity"
                className="w-full border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button type="button" onClick={() => setProductModal(false)} className="text-sm text-ink/50 hover:text-ink">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddProduct}
                disabled={savingProduct}
                className="rounded-lg bg-accent px-4 py-2 text-sm text-paper hover:bg-accent-dim transition-colors disabled:opacity-50"
              >
                {savingProduct ? "Adding…" : "Add product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}