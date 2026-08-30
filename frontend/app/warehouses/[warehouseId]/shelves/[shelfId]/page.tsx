"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import {
  getSubShelves,
  createSubShelf,
  addProductToSubShelf,
  deleteSubShelf,
} from "@/lib/subshelf";
import type { SubShelf } from "@/types/subshelf";

export default function ShelfDetailPage() {
  const params = useParams<{ warehouseId: string; shelfId: string }>();
  const router = useRouter();
  const { store } = useStore();

  const [subShelves, setSubShelves] = useState<SubShelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creatingSubShelf, setCreatingSubShelf] = useState(false);
  const [newSubShelfName, setNewSubShelfName] = useState("");

  const [productModalFor, setProductModalFor] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productQty, setProductQty] = useState("");
  const [submittingProduct, setSubmittingProduct] = useState(false);

  const load = useCallback(async () => {
    if (!store) return;
    try {
      const { subShelves } = await getSubShelves(store.id, params.warehouseId, params.shelfId);
      setSubShelves(subShelves);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load sub-shelves.");
    } finally {
      setLoading(false);
    }
  }, [store, params.warehouseId, params.shelfId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateSubShelf = async () => {
    if (!store || !newSubShelfName.trim()) return;
    try {
      await createSubShelf(store.id, params.warehouseId, params.shelfId, {
        name: newSubShelfName.trim(),
      });
      setNewSubShelfName("");
      setCreatingSubShelf(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create sub-shelf.");
    }
  };

  const handleDeleteSubShelf = async (subShelfId: string) => {
    if (!store) return;
    try {
      await deleteSubShelf(store.id, params.warehouseId, params.shelfId, subShelfId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete sub-shelf.");
    }
  };

  const handleAddProduct = async () => {
    if (!store || !productModalFor || !productName.trim() || !productQty) return;
    setSubmittingProduct(true);
    try {
      await addProductToSubShelf(store.id, params.warehouseId, params.shelfId, productModalFor, {
        name: productName.trim(),
        sku: productSku.trim() || undefined,
        quantity: parseInt(productQty, 10),
      });
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
        <p className="font-mono text-sm text-ink/50">Loading sub-shelves…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm text-ink/50 hover:text-accent transition-colors mb-4"
      >
        ← Back to shelf
      </button>

      <header className="flex items-start justify-between mb-8">
        <div>
          <p className="eyebrow mb-2">Sub-shelves</p>
          <h1 className="font-display text-2xl text-ink">
            {subShelves.length} / 10 sub-shelves used
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setCreatingSubShelf(true)}
          disabled={subShelves.length >= 10}
          className="bg-accent px-4 py-2 text-sm tracking-wide text-paper hover:bg-accent-dim transition-colors disabled:opacity-40"
        >
          + New sub-shelf
        </button>
      </header>

      {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

      {creatingSubShelf && (
        <div className="ledger-card px-6 py-5 mb-6 flex items-center gap-3">
          <input
            type="text"
            value={newSubShelfName}
            onChange={(e) => setNewSubShelfName(e.target.value)}
            placeholder="Sub-shelf name"
            className="flex-1 border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:border-accent"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreateSubShelf}
            className="bg-accent px-4 py-2 text-sm text-paper hover:bg-accent-dim transition-colors"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setCreatingSubShelf(false)}
            className="text-sm text-ink/50 hover:text-ink"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {subShelves.map((subShelf) => {
          const pct = Math.round((subShelf.productQuantity / subShelf.capacity) * 100);
          const full = subShelf.availableCapacity <= 0;

          return (
            <div key={subShelf.id} className="ledger-card px-6 py-5">
              <div className="flex items-start justify-between mb-1">
                <h2 className="font-display text-xl italic text-ink">{subShelf.name}</h2>
                <button
                  type="button"
                  onClick={() => handleDeleteSubShelf(subShelf.id)}
                  className="eyebrow border border-ink/20 px-2 py-1 text-xs hover:border-rust hover:text-rust transition-colors"
                >
                  Delete
                </button>
              </div>
              <p className="text-xs text-ink/50 mb-3">
                Up to {subShelf.maxBoxes} boxes
              </p>

              <div className="flex items-center justify-between text-xs text-ink/60 mb-1">
                <span className="eyebrow">Products stored</span>
                <span>
                  {subShelf.productQuantity} / {subShelf.capacity} ({pct}%)
                </span>
              </div>
              <div className="h-1.5 bg-line rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full ${full ? "bg-rust" : "bg-accent"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <p className="text-xs text-ink/50 mb-4">
                {subShelf.availableCapacity} units of space left
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProductModalFor(subShelf.id)}
                  disabled={full}
                  className="border border-line px-3 py-2 text-xs tracking-wide hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
                >
                  {full ? "Sub-shelf full" : "+ Add product"}
                </button>
                <button
                  type="button"
                  disabled
                  title="Boxes coming soon"
                  className="border border-line px-3 py-2 text-xs tracking-wide opacity-40 cursor-not-allowed"
                >
                  + Add box
                </button>
              </div>
            </div>
          );
        })}
      </div>

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