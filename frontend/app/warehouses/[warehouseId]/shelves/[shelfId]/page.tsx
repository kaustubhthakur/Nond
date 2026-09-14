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

const SUB_SHELF_LIMIT = 10;

export default function ShelfDetailPage() {
  const params = useParams<{ warehouseId: string; shelfId: string }>();
  const router = useRouter();
  const { store } = useStore();

  const [subShelves, setSubShelves] = useState<SubShelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creatingSubShelf, setCreatingSubShelf] = useState(false);
  const [newSubShelfName, setNewSubShelfName] = useState("");
  const [submittingSubShelf, setSubmittingSubShelf] = useState(false);

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
    setSubmittingSubShelf(true);
    try {
      await createSubShelf(store.id, params.warehouseId, params.shelfId, {
        name: newSubShelfName.trim(),
      });
      setNewSubShelfName("");
      setCreatingSubShelf(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create sub-shelf.");
    } finally {
      setSubmittingSubShelf(false);
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

  const atSubShelfLimit = subShelves.length >= SUB_SHELF_LIMIT;

  // ---------- Loading state ----------

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 flex flex-col items-center justify-center gap-3">
        <div className="h-5 w-5 rounded-full border-2 border-ink/15 border-t-accent animate-spin" />
        <p className="text-sm text-ink/40">Loading sub-shelves…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/45 hover:text-accent transition-colors mb-5"
      >
        <svg
          className="h-3 w-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to shelf
      </button>

      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10 pb-8 border-b border-line">
        <div>
          <p className="eyebrow mb-2 text-ink/45">Sub-shelves</p>
          <h1 className="font-display text-3xl italic text-ink tracking-wide">
            {subShelves.length} / {SUB_SHELF_LIMIT} used
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setCreatingSubShelf(true)}
          disabled={atSubShelfLimit}
          title={atSubShelfLimit ? "Sub-shelf limit reached" : undefined}
          className="group inline-flex items-center gap-2 self-start rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-paper shadow-sm shadow-accent/20 transition-all hover:bg-accent/90 hover:shadow-md hover:shadow-accent/25 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
        >
          <svg
            className="h-4 w-4 transition-transform group-hover:rotate-90"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          New sub-shelf
        </button>
      </header>

      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-rust/30 bg-rust/[0.06] text-rust text-sm px-4 py-3.5 mb-8">
          <svg
            className="h-4 w-4 mt-0.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
          </svg>
          <p className="leading-relaxed">{error}</p>
        </div>
      ) : null}

      {creatingSubShelf ? (
        <div className="ledger-card rounded-xl px-6 py-5 mb-8 flex items-center gap-3">
          <input
            type="text"
            value={newSubShelfName}
            onChange={(e) => setNewSubShelfName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateSubShelf()}
            placeholder="Sub-shelf name"
            className="flex-1 border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:border-accent transition-colors"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreateSubShelf}
            disabled={submittingSubShelf || !newSubShelfName.trim()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-paper hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submittingSubShelf ? "Creating…" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCreatingSubShelf(false);
              setNewSubShelfName("");
            }}
            className="text-sm text-ink/50 hover:text-ink transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : null}

      {subShelves.length === 0 ? (
        <div className="border border-dashed border-line rounded-xl text-center py-20 px-6">
          <div className="mx-auto mb-4 h-11 w-11 rounded-full bg-ink/[0.04] flex items-center justify-center">
            <svg
              className="h-5 w-5 text-ink/35"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <rect x="4" y="4" width="7" height="16" rx="1" />
              <rect x="13" y="4" width="7" height="16" rx="1" />
            </svg>
          </div>
          <p className="text-sm text-ink/55 max-w-xs mx-auto leading-relaxed">
            No sub-shelves yet. Create one to start storing products.
          </p>
          <button
            type="button"
            onClick={() => setCreatingSubShelf(true)}
            className="mt-5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            Create your first sub-shelf
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {subShelves.map((subShelf) => {
            const pct = Math.round(
              (subShelf.productQuantity / subShelf.capacity) * 100
            );
            const full = subShelf.availableCapacity <= 0;

            return (
              <div
                key={subShelf.id}
                className="ledger-card rounded-xl px-6 py-5 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between mb-1 gap-3">
                  <h2 className="font-display text-xl italic text-ink truncate">
                    {subShelf.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubShelf(subShelf.id)}
                    className="shrink-0 rounded-md border border-ink/15 px-2.5 py-1 text-xs text-ink/50 hover:border-rust/50 hover:text-rust hover:bg-rust/5 transition-colors"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-xs text-ink/50 mb-4">
                  Up to {subShelf.maxBoxes} boxes
                </p>

                <div className="flex items-center justify-between text-xs text-ink/60 mb-1.5">
                  <span className="eyebrow">Products stored</span>
                  <span className="font-medium text-ink/70">
                    {subShelf.productQuantity} / {subShelf.capacity} ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 bg-line rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full rounded-full transition-all ${
                      full ? "bg-rust" : "bg-accent"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-ink/45 mb-5">
                  {subShelf.availableCapacity} units of space left
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProductModalFor(subShelf.id)}
                    disabled={full}
                    className="rounded-md border border-line px-3 py-2 text-xs font-medium tracking-wide hover:border-accent hover:text-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-ink"
                  >
                    {full ? "Sub-shelf full" : "+ Add product"}
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Boxes coming soon"
                    className="rounded-md border border-line px-3 py-2 text-xs font-medium tracking-wide opacity-40 cursor-not-allowed"
                  >
                    + Add box
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {productModalFor ? (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] flex items-center justify-center z-20 px-4">
          <div className="ledger-card bg-paper rounded-xl shadow-xl px-6 py-6 w-full max-w-sm">
            <h3 className="font-display text-lg italic text-ink mb-5">
              Add product
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Product name"
                className="w-full border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:border-accent transition-colors"
                autoFocus
              />
              <input
                type="text"
                value={productSku}
                onChange={(e) => setProductSku(e.target.value)}
                placeholder="SKU (optional)"
                className="w-full border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:border-accent transition-colors"
              />
              <input
                type="number"
                min={1}
                value={productQty}
                onChange={(e) => setProductQty(e.target.value)}
                placeholder="Quantity"
                className="w-full border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => setProductModalFor(null)}
                className="text-sm text-ink/50 hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddProduct}
                disabled={submittingProduct || !productName.trim() || !productQty}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-paper hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingProduct ? "Adding…" : "Add product"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}