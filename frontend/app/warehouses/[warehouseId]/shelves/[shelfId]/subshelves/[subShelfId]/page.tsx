"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { getSubShelves } from "@/lib/subshelf";
import type { SubShelf } from "@/types/subshelf";
import {
  getBoxes,
  createBox,
  addProductToBox,
  deleteBox,
} from "@/lib/box";
import type { Box } from "@/types/box";

export default function SubShelfDetailPage() {
  const params = useParams<{
    warehouseId: string;
    shelfId: string;
    subShelfId: string;
  }>();
  const router = useRouter();
  const { store } = useStore();

  const [subShelf, setSubShelf] = useState<SubShelf | null>(null);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creatingBox, setCreatingBox] = useState(false);
  const [newBoxName, setNewBoxName] = useState("");

  const [productModalFor, setProductModalFor] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productQty, setProductQty] = useState("");
  const [submittingProduct, setSubmittingProduct] = useState(false);

  const load = useCallback(async () => {
    if (!store) return;
    try {
      const [{ subShelves }, { boxes }] = await Promise.all([
        getSubShelves(store.id, params.warehouseId, params.shelfId),
        getBoxes(store.id, params.warehouseId, params.shelfId, params.subShelfId),
      ]);
      setSubShelf(subShelves.find((s) => s.id === params.subShelfId) ?? null);
      setBoxes(boxes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load boxes.");
    } finally {
      setLoading(false);
    }
  }, [store, params.warehouseId, params.shelfId, params.subShelfId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateBox = async () => {
    if (!store || !newBoxName.trim()) return;
    try {
      await createBox(store.id, params.warehouseId, params.shelfId, params.subShelfId, {
        name: newBoxName.trim(),
      });
      setNewBoxName("");
      setCreatingBox(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create box.");
    }
  };

  const handleDeleteBox = async (boxId: string) => {
    if (!store) return;
    try {
      await deleteBox(store.id, params.warehouseId, params.shelfId, params.subShelfId, boxId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete box.");
    }
  };

  const handleAddProduct = async () => {
    if (!store || !productModalFor || !productName.trim() || !productQty) return;
    setSubmittingProduct(true);
    try {
      await addProductToBox(
        store.id,
        params.warehouseId,
        params.shelfId,
        params.subShelfId,
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
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add product.");
    } finally {
      setSubmittingProduct(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-mono text-sm text-ink/50">Loading boxes…</p>
      </main>
    );
  }

  const maxBoxes = subShelf?.maxBoxes ?? 0;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm text-ink/50 hover:text-accent transition-colors mb-4"
      >
        ← Back to sub-shelves
      </button>

      <header className="flex items-start justify-between mb-8">
        <div>
          <p className="eyebrow mb-2">Boxes {subShelf ? `· ${subShelf.name}` : ""}</p>
          <h1 className="font-display text-2xl text-ink">
            {boxes.length} / {maxBoxes} boxes used
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setCreatingBox(true)}
          disabled={maxBoxes > 0 && boxes.length >= maxBoxes}
          className="bg-accent px-4 py-2 text-sm tracking-wide text-paper hover:bg-accent-dim transition-colors disabled:opacity-40"
        >
          + New box
        </button>
      </header>

      {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

      {creatingBox && (
        <div className="ledger-card px-6 py-5 mb-6 flex items-center gap-3">
          <input
            type="text"
            value={newBoxName}
            onChange={(e) => setNewBoxName(e.target.value)}
            placeholder="Box name"
            className="flex-1 border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:border-accent"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreateBox}
            className="bg-accent px-4 py-2 text-sm text-paper hover:bg-accent-dim transition-colors"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setCreatingBox(false)}
            className="text-sm text-ink/50 hover:text-ink"
          >
            Cancel
          </button>
        </div>
      )}

      {boxes.length === 0 ? (
        <div className="border border-dashed border-line text-center py-16 px-6">
          <p className="text-sm text-ink/60">No boxes yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {boxes.map((box) => {
            const pct = Math.round((box.productQuantity / box.capacity) * 100);
            const full = box.availableCapacity <= 0;

            return (
              <div key={box.id} className="ledger-card px-6 py-5">
                <div className="flex items-start justify-between mb-1">
                  <h2 className="font-display text-xl italic text-ink">{box.name}</h2>
                  <button
                    type="button"
                    onClick={() => handleDeleteBox(box.id)}
                    className="eyebrow border border-ink/20 px-2 py-1 text-xs hover:border-rust hover:text-rust transition-colors"
                  >
                    Delete
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-ink/60 mb-1">
                  <span className="eyebrow">Products stored</span>
                  <span>
                    {box.productQuantity} / {box.capacity} ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 bg-line rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full ${full ? "bg-rust" : "bg-accent"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-ink/50 mb-4">
                  {box.availableCapacity} units of space left
                </p>

                <button
                  type="button"
                  onClick={() => setProductModalFor(box.id)}
                  disabled={full}
                  className="w-full border border-line px-3 py-2 text-xs tracking-wide hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
                >
                  {full ? "Box full" : "+ Add product"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {productModalFor && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-20 px-4">
          <div className="ledger-card bg-paper px-6 py-6 w-full max-w-sm">
            <h3 className="font-display text-lg text-ink mb-4">Add product</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Product name"
                className="w-full border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:border-accent"
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
                onClick={handleAddProduct}
                disabled={submittingProduct}
                className="bg-accent px-4 py-2 text-sm text-paper hover:bg-accent-dim transition-colors disabled:opacity-50"
              >
                {submittingProduct ? "Adding…" : "Add product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}