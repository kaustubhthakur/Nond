"use client";

import { useState } from "react";
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
import { CapacityRing } from "./CapacityRing";

interface ShelfCardProps {
  shelf: Shelf;
  onDelete: (shelf: Shelf) => Promise<void>;
  onAddProduct: (shelf: Shelf) => void;
  onAddSubShelf: (shelf: Shelf) => void;
  onShelfChanged?: (shelf: Shelf) => void;
}

function StatusPill({ full }: { full: boolean }) {
  return (
    <span
      className={`eyebrow text-[10px] px-2 py-0.5 rounded-full ${
        full
          ? "bg-rust/10 text-rust"
          : "bg-accent/10 text-accent"
      }`}
    >
      {full ? "Full" : "Open"}
    </span>
  );
}

export function ShelfCard({
  shelf,
  onDelete,
  onAddProduct,
  onAddSubShelf,
  onShelfChanged,
}: ShelfCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [expanded, setExpanded] = useState(false);
  const [subShelves, setSubShelves] = useState<SubShelf[]>([]);
  const [loadingSubShelves, setLoadingSubShelves] = useState(false);
  const [subShelfError, setSubShelfError] = useState<string | null>(null);

  const [creatingSubShelf, setCreatingSubShelf] = useState(false);
  const [newSubShelfName, setNewSubShelfName] = useState("");
  const [savingSubShelf, setSavingSubShelf] = useState(false);

  const [productModalFor, setProductModalFor] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productQty, setProductQty] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);

  const [expandedBoxesFor, setExpandedBoxesFor] = useState<string | null>(null);
  const [boxesBySubShelf, setBoxesBySubShelf] = useState<Record<string, Box[]>>({});
  const [loadingBoxes, setLoadingBoxes] = useState(false);
  const [boxError, setBoxError] = useState<string | null>(null);

  const [creatingBoxFor, setCreatingBoxFor] = useState<string | null>(null);
  const [newBoxName, setNewBoxName] = useState("");
  const [savingBox, setSavingBox] = useState(false);

  const [boxProductModalFor, setBoxProductModalFor] = useState<{
    subShelfId: string;
    boxId: string;
  } | null>(null);
  const [boxProductName, setBoxProductName] = useState("");
  const [boxProductSku, setBoxProductSku] = useState("");
  const [boxProductQty, setBoxProductQty] = useState("");
  const [savingBoxProduct, setSavingBoxProduct] = useState(false);

  const shelfFull = shelf.availableCapacity <= 0;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(shelf);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  const loadSubShelves = async () => {
    setLoadingSubShelves(true);
    setSubShelfError(null);
    try {
      const { subShelves } = await getSubShelves(
        shelf.storeId,
        shelf.warehouseId,
        shelf.id
      );
      setSubShelves(subShelves);
    } catch (err) {
      setSubShelfError(
        err instanceof Error ? err.message : "Could not load sub-shelves."
      );
    } finally {
      setLoadingSubShelves(false);
    }
  };

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && subShelves.length === 0) {
      loadSubShelves();
    }
  };

  const handleCreateSubShelf = async () => {
    if (!newSubShelfName.trim()) return;
    setSavingSubShelf(true);
    try {
      await createSubShelf(shelf.storeId, shelf.warehouseId, shelf.id, {
        name: newSubShelfName.trim(),
      });
      setNewSubShelfName("");
      setCreatingSubShelf(false);
      await loadSubShelves();
    } catch (err) {
      setSubShelfError(
        err instanceof Error ? err.message : "Could not create sub-shelf."
      );
    } finally {
      setSavingSubShelf(false);
    }
  };

  const handleDeleteSubShelf = async (subShelfId: string) => {
    try {
      await deleteSubShelf(shelf.storeId, shelf.warehouseId, shelf.id, subShelfId);
      await loadSubShelves();
      onShelfChanged?.(shelf);
    } catch (err) {
      setSubShelfError(
        err instanceof Error ? err.message : "Could not delete sub-shelf."
      );
    }
  };

  const handleAddProductToSubShelf = async () => {
    if (!productModalFor || !productName.trim() || !productQty) return;
    setSavingProduct(true);
    try {
      await addProductToSubShelf(
        shelf.storeId,
        shelf.warehouseId,
        shelf.id,
        productModalFor,
        {
          name: productName.trim(),
          sku: productSku.trim() || undefined,
          quantity: parseInt(productQty, 10),
        }
      );
      setProductModalFor(null);
      setProductName("");
      setProductSku("");
      setProductQty("");
      await loadSubShelves();
      onShelfChanged?.(shelf);
    } catch (err) {
      setSubShelfError(
        err instanceof Error ? err.message : "Could not add product."
      );
    } finally {
      setSavingProduct(false);
    }
  };

  const loadBoxes = async (subShelfId: string) => {
    setLoadingBoxes(true);
    setBoxError(null);
    try {
      const { boxes } = await getBoxes(
        shelf.storeId,
        shelf.warehouseId,
        shelf.id,
        subShelfId
      );
      setBoxesBySubShelf((prev) => ({ ...prev, [subShelfId]: boxes }));
    } catch (err) {
      setBoxError(err instanceof Error ? err.message : "Could not load boxes.");
    } finally {
      setLoadingBoxes(false);
    }
  };

  const toggleBoxesExpanded = (subShelfId: string) => {
    const next = expandedBoxesFor === subShelfId ? null : subShelfId;
    setExpandedBoxesFor(next);
    if (next && !boxesBySubShelf[subShelfId]) {
      loadBoxes(subShelfId);
    }
  };

  const handleCreateBox = async (subShelfId: string) => {
    if (!newBoxName.trim()) return;
    setSavingBox(true);
    try {
      await createBox(shelf.storeId, shelf.warehouseId, shelf.id, subShelfId, {
        name: newBoxName.trim(),
      });
      setNewBoxName("");
      setCreatingBoxFor(null);
      await loadBoxes(subShelfId);
    } catch (err) {
      setBoxError(err instanceof Error ? err.message : "Could not create box.");
    } finally {
      setSavingBox(false);
    }
  };

  const handleDeleteBox = async (subShelfId: string, boxId: string) => {
    try {
      await deleteBox(shelf.storeId, shelf.warehouseId, shelf.id, subShelfId, boxId);
      await loadBoxes(subShelfId);
      await loadSubShelves();
      onShelfChanged?.(shelf);
    } catch (err) {
      setBoxError(err instanceof Error ? err.message : "Could not delete box.");
    }
  };

  const handleAddProductToBox = async () => {
    if (!boxProductModalFor || !boxProductName.trim() || !boxProductQty) return;
    const { subShelfId, boxId } = boxProductModalFor;
    setSavingBoxProduct(true);
    try {
      await addProductToBox(
        shelf.storeId,
        shelf.warehouseId,
        shelf.id,
        subShelfId,
        boxId,
        {
          name: boxProductName.trim(),
          sku: boxProductSku.trim() || undefined,
          quantity: parseInt(boxProductQty, 10),
        }
      );
      setBoxProductModalFor(null);
      setBoxProductName("");
      setBoxProductSku("");
      setBoxProductQty("");
      await loadBoxes(subShelfId);
      await loadSubShelves();
      onShelfChanged?.(shelf);
    } catch (err) {
      setBoxError(err instanceof Error ? err.message : "Could not add product.");
    } finally {
      setSavingBoxProduct(false);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-paper shadow-sm overflow-hidden flex flex-col">
      {/* Shelf header */}
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3">
            <CapacityRing used={shelf.productQuantity} capacity={shelf.capacity} size={52} thickness={6} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display italic text-lg text-ink tracking-wide truncate">
                  {shelf.name}
                </h3>
                <StatusPill full={shelfFull} />
              </div>
              <p className="text-xs text-ink/50 mt-0.5 font-mono">
                {shelf.productQuantity.toLocaleString()} / {shelf.capacity.toLocaleString()} units
              </p>
            </div>
          </div>

          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="eyebrow shrink-0 text-[11px] text-ink/40 hover:text-rust transition-colors"
            >
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="eyebrow text-[11px] text-rust hover:underline disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="eyebrow text-[11px] text-ink/40 hover:text-ink"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {shelf.description ? (
          <p className="text-sm text-ink/70 leading-relaxed -mt-1">
            {shelf.description}
          </p>
        ) : null}

        <p className="text-xs text-ink/40">
          {shelf.availableCapacity.toLocaleString()} unit
          {shelf.availableCapacity === 1 ? "" : "s"} left · up to {shelf.maxSubShelves} sub-shelves
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onAddProduct(shelf)}
            disabled={shelfFull}
            className="flex-1 eyebrow rounded-lg border border-ink/15 px-3 py-2 text-ink/70 hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
          >
            {shelfFull ? "Shelf full" : "+ Add product"}
          </button>
          <button
            type="button"
            onClick={() => setCreatingSubShelf((v) => !v)}
            className="flex-1 eyebrow rounded-lg border border-ink/15 px-3 py-2 text-ink/70 hover:border-accent hover:text-accent transition-colors"
          >
            + Add sub-shelf
          </button>
        </div>

        {creatingSubShelf && (
          <div className="rounded-lg border border-line bg-paper/60 p-3 flex items-center gap-2">
            <input
              type="text"
              value={newSubShelfName}
              onChange={(e) => setNewSubShelfName(e.target.value)}
              placeholder="Sub-shelf name"
              className="flex-1 border-b border-line bg-transparent py-1.5 text-sm focus:outline-none focus:border-accent"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreateSubShelf}
              disabled={savingSubShelf}
              className="eyebrow rounded-lg bg-accent px-3 py-1.5 text-paper hover:bg-accent-dim transition-colors disabled:opacity-50"
            >
              {savingSubShelf ? "Saving…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setCreatingSubShelf(false)}
              className="eyebrow text-ink/50 hover:text-ink px-2"
            >
              Cancel
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={toggleExpanded}
          className="text-xs text-ink/50 hover:text-accent transition-colors text-left flex items-center gap-1"
        >
          <span className="inline-block transition-transform" style={{ transform: expanded ? "rotate(90deg)" : "none" }}>
            ›
          </span>
          {expanded
            ? "Hide sub-shelves"
            : `View sub-shelves${subShelves.length ? ` (${subShelves.length})` : ""}`}
        </button>
      </div>

      {/* Sub-shelves */}
      {expanded && (
        <div className="bg-ink/[0.03] border-t border-line px-5 py-4 flex flex-col gap-3">
          {subShelfError && <p className="text-xs text-rust">{subShelfError}</p>}

          {loadingSubShelves ? (
            <p className="text-xs text-ink/50">Loading sub-shelves…</p>
          ) : subShelves.length === 0 ? (
            <p className="text-xs text-ink/50">No sub-shelves yet.</p>
          ) : (
            subShelves.map((subShelf) => {
              const subFull = subShelf.availableCapacity <= 0;
              const boxesExpanded = expandedBoxesFor === subShelf.id;
              const boxes = boxesBySubShelf[subShelf.id] ?? [];

              return (
                <div
                  key={subShelf.id}
                  className="rounded-lg border border-line/70 bg-paper p-3 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CapacityRing
                        used={subShelf.productQuantity}
                        capacity={subShelf.capacity}
                        size={36}
                        thickness={4}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-display italic text-sm text-ink truncate">
                            {subShelf.name}
                          </p>
                          <StatusPill full={subFull} />
                        </div>
                        <p className="text-[11px] text-ink/45 font-mono">
                          {subShelf.productQuantity} / {subShelf.capacity} · up to {subShelf.maxBoxes} boxes
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubShelf(subShelf.id)}
                      className="eyebrow text-[10px] text-ink/40 hover:text-rust transition-colors shrink-0"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProductModalFor(subShelf.id)}
                      disabled={subFull}
                      className="eyebrow rounded-md border border-ink/15 px-2 py-1.5 text-[11px] text-ink/70 hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
                    >
                      {subFull ? "Full" : "+ Add product"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreatingBoxFor(subShelf.id)}
                      className="eyebrow rounded-md border border-ink/15 px-2 py-1.5 text-[11px] text-ink/70 hover:border-accent hover:text-accent transition-colors"
                    >
                      + Add box
                    </button>
                  </div>

                  {creatingBoxFor === subShelf.id && (
                    <div className="rounded-md border border-line bg-paper/60 p-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={newBoxName}
                        onChange={(e) => setNewBoxName(e.target.value)}
                        placeholder="Box name"
                        className="flex-1 border-b border-line bg-transparent py-1 text-xs focus:outline-none focus:border-accent"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleCreateBox(subShelf.id)}
                        disabled={savingBox}
                        className="eyebrow rounded-md bg-accent px-2 py-1 text-[11px] text-paper hover:bg-accent-dim transition-colors disabled:opacity-50"
                      >
                        {savingBox ? "Saving…" : "Create"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreatingBoxFor(null)}
                        className="eyebrow text-[11px] text-ink/50 hover:text-ink px-1"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleBoxesExpanded(subShelf.id)}
                    className="text-[11px] text-ink/45 hover:text-accent transition-colors text-left flex items-center gap-1"
                  >
                    <span
                      className="inline-block transition-transform"
                      style={{ transform: boxesExpanded ? "rotate(90deg)" : "none" }}
                    >
                      ›
                    </span>
                    {boxesExpanded ? "Hide boxes" : `View boxes${boxes.length ? ` (${boxes.length})` : ""}`}
                  </button>

                  {boxesExpanded && (
                    <div className="rounded-lg bg-ink/[0.03] p-2.5 flex flex-col gap-2">
                      {boxError && <p className="text-[11px] text-rust">{boxError}</p>}
                      {loadingBoxes && boxes.length === 0 ? (
                        <p className="text-[11px] text-ink/50">Loading boxes…</p>
                      ) : boxes.length === 0 ? (
                        <p className="text-[11px] text-ink/50">No boxes yet.</p>
                      ) : (
                        boxes.map((box) => {
                          const boxFull = box.availableCapacity <= 0;
                          return (
                            <div
                              key={box.id}
                              className="rounded-md border border-line/60 bg-paper p-2.5 flex items-center gap-2.5"
                            >
                              <CapacityRing
                                used={box.productQuantity}
                                capacity={box.capacity}
                                size={30}
                                thickness={4}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-mono text-xs text-ink truncate">{box.name}</p>
                                  <StatusPill full={boxFull} />
                                </div>
                                <p className="text-[10px] text-ink/45 font-mono">
                                  {box.productQuantity} / {box.capacity}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setBoxProductModalFor({ subShelfId: subShelf.id, boxId: box.id })
                                }
                                disabled={boxFull}
                                className="eyebrow rounded-md border border-ink/15 px-2 py-1 text-[10px] text-ink/70 hover:border-accent hover:text-accent transition-colors disabled:opacity-40 shrink-0"
                              >
                                + Product
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBox(subShelf.id, box.id)}
                                className="eyebrow text-[10px] text-ink/40 hover:text-rust transition-colors shrink-0"
                              >
                                Delete
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {productModalFor && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-20 px-4">
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
              <button type="button" onClick={() => setProductModalFor(null)} className="text-sm text-ink/50 hover:text-ink">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddProductToSubShelf}
                disabled={savingProduct}
                className="rounded-lg bg-accent px-4 py-2 text-sm text-paper hover:bg-accent-dim transition-colors disabled:opacity-50"
              >
                {savingProduct ? "Adding…" : "Add product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {boxProductModalFor && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-20 px-4">
          <div className="rounded-xl border border-line bg-paper p-6 w-full max-w-sm shadow-lg">
            <h3 className="font-display text-lg text-ink mb-4">Add product to box</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={boxProductName}
                onChange={(e) => setBoxProductName(e.target.value)}
                placeholder="Product name"
                className="w-full border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:border-accent"
                autoFocus
              />
              <input
                type="text"
                value={boxProductSku}
                onChange={(e) => setBoxProductSku(e.target.value)}
                placeholder="SKU (optional)"
                className="w-full border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:border-accent"
              />
              <input
                type="number"
                min={1}
                value={boxProductQty}
                onChange={(e) => setBoxProductQty(e.target.value)}
                placeholder="Quantity"
                className="w-full border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button type="button" onClick={() => setBoxProductModalFor(null)} className="text-sm text-ink/50 hover:text-ink">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddProductToBox}
                disabled={savingBoxProduct}
                className="rounded-lg bg-accent px-4 py-2 text-sm text-paper hover:bg-accent-dim transition-colors disabled:opacity-50"
              >
                {savingBoxProduct ? "Adding…" : "Add product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}