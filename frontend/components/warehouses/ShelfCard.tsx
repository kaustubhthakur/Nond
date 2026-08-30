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

interface ShelfCardProps {
  shelf: Shelf;
  onDelete: (shelf: Shelf) => Promise<void>;
  onAddProduct: (shelf: Shelf) => void;
  onAddSubShelf: (shelf: Shelf) => void;
  onShelfChanged?: (shelf: Shelf) => void;
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

  const percent =
    shelf.capacity > 0
      ? Math.min(
          100,
          Math.round((shelf.productQuantity / shelf.capacity) * 100)
        )
      : 0;

  const barColor =
    percent >= 90 ? "bg-rust" : percent >= 65 ? "bg-accent/70" : "bg-accent";

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

  return (
    <div className="border border-line bg-paper p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display italic text-lg text-ink tracking-wide truncate">
            {shelf.name}
          </h3>
          <p className="text-xs text-ink/50 mt-0.5">
            Up to {shelf.maxSubShelves} sub-shelves
          </p>
        </div>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="eyebrow shrink-0 border border-ink/20 px-2.5 py-1 text-ink/60 hover:border-rust hover:text-rust transition-colors"
          >
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="eyebrow border border-rust text-rust px-2.5 py-1 hover:bg-rust hover:text-paper transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="eyebrow border border-ink/20 px-2.5 py-1 text-ink/60 hover:text-ink transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {shelf.description ? (
        <p className="text-sm text-ink/70 leading-relaxed">
          {shelf.description}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between text-xs text-ink/60">
          <span className="eyebrow">Products stored</span>
          <span>
            {shelf.productQuantity} / {shelf.capacity} ({percent}%)
          </span>
        </div>

        <div className="h-2 w-full bg-ink/10 overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="text-xs text-ink/50">
          {shelf.availableCapacity.toLocaleString()} unit
          {shelf.availableCapacity === 1 ? "" : "s"} of space left
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onAddProduct(shelf)}
          disabled={shelf.availableCapacity <= 0}
          className="flex-1 eyebrow border border-ink/20 px-3 py-1.5 text-ink/70 hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
        >
          {shelf.availableCapacity <= 0 ? "Shelf full" : "+ Add product"}
        </button>
        <button
          type="button"
          onClick={() => setCreatingSubShelf(true)}
          className="flex-1 eyebrow border border-ink/20 px-3 py-1.5 text-ink/70 hover:border-accent hover:text-accent transition-colors"
        >
          + Add sub-shelf
        </button>
      </div>

      <button
        type="button"
        onClick={toggleExpanded}
        className="text-xs text-ink/50 hover:text-accent transition-colors text-left"
      >
        {expanded ? "▾ Hide sub-shelves" : "▸ View sub-shelves"}
      </button>

      {creatingSubShelf && (
        <div className="border border-line bg-paper/60 p-3 flex items-center gap-2">
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
            className="eyebrow bg-accent px-3 py-1.5 text-paper hover:bg-accent-dim transition-colors disabled:opacity-50"
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

      {expanded && (
        <div className="flex flex-col gap-3 pt-1 border-t border-line">
          {subShelfError && (
            <p className="text-xs text-red-700 mt-3">{subShelfError}</p>
          )}

          {loadingSubShelves ? (
            <p className="text-xs text-ink/50 mt-3">Loading sub-shelves…</p>
          ) : subShelves.length === 0 ? (
            <p className="text-xs text-ink/50 mt-3">No sub-shelves yet.</p>
          ) : (
            <div className="flex flex-col gap-3 mt-3">
              {subShelves.map((subShelf) => {
                const subPct =
                  subShelf.capacity > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (subShelf.productQuantity / subShelf.capacity) * 100
                        )
                      )
                    : 0;
                const subFull = subShelf.availableCapacity <= 0;

                return (
                  <div
                    key={subShelf.id}
                    className="border border-line/70 bg-paper/40 p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display italic text-sm text-ink truncate">
                          {subShelf.name}
                        </p>
                        <p className="text-[11px] text-ink/50">
                          Up to {subShelf.maxBoxes} boxes
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubShelf(subShelf.id)}
                        className="eyebrow text-[11px] border border-ink/20 px-2 py-0.5 text-ink/60 hover:border-rust hover:text-rust transition-colors shrink-0"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="flex items-baseline justify-between text-[11px] text-ink/60">
                      <span className="eyebrow">Products</span>
                      <span>
                        {subShelf.productQuantity} / {subShelf.capacity} ({subPct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-ink/10 overflow-hidden">
                      <div
                        className={`h-full ${subFull ? "bg-rust" : "bg-accent"}`}
                        style={{ width: `${subPct}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setProductModalFor(subShelf.id)}
                        disabled={subFull}
                        className="eyebrow border border-ink/20 px-2 py-1.5 text-[11px] text-ink/70 hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
                      >
                        {subFull ? "Full" : "+ Add product"}
                      </button>
                      <button
                        type="button"
                        disabled
                        title="Boxes coming soon"
                        className="eyebrow border border-ink/20 px-2 py-1.5 text-[11px] text-ink/30 cursor-not-allowed"
                      >
                        + Add box
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {productModalFor && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-20 px-4">
          <div className="border border-line bg-paper p-6 w-full max-w-sm">
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
              <button
                type="button"
                onClick={() => setProductModalFor(null)}
                className="text-sm text-ink/50 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddProductToSubShelf}
                disabled={savingProduct}
                className="bg-accent px-4 py-2 text-sm text-paper hover:bg-accent-dim transition-colors disabled:opacity-50"
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