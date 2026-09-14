"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { warehouseApi } from "@/lib/warehouseApi";
import { shelfApi } from "@/lib/shelfApi";
import { ApiError } from "@/types/auth";
import { Warehouse } from "@/types/warehouse";
import { CreateShelfPayload, Shelf } from "@/types/shelf";
import { ShelfGrid } from "@/components/warehouses/ShelfGrid";
import { CreateShelfModal } from "@/components/warehouses/CreateShelfModal";

export default function WarehouseShelvesPage() {
  const { store, isLoading: storeLoading } = useStore();
  const params = useParams<{ warehouseId: string }>();
  const warehouseId = params.warehouseId;

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [shelfCapacity, setShelfCapacity] = useState(0);
  const [availableShelves, setAvailableShelves] = useState(0);
  const [maxSubShelves, setMaxSubShelves] = useState(0);
  const [maxProducts, setMaxProducts] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!store) return;

    setLoading(true);
    setError(null);

    try {
      const [warehouseRes, shelvesRes, optionsRes] = await Promise.all([
        warehouseApi.get(store.id, warehouseId),
        shelfApi.list(store.id, warehouseId),
        shelfApi.getOptions(),
      ]);

      setWarehouse(warehouseRes.warehouse);
      setShelves(shelvesRes.shelves);
      setShelfCapacity(shelvesRes.shelfCapacity);
      setAvailableShelves(shelvesRes.availableShelves);
      setMaxSubShelves(optionsRes.maxSubShelves);
      setMaxProducts(optionsRes.maxProducts);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load shelves"
      );
    } finally {
      setLoading(false);
    }
  }, [store, warehouseId]);

  useEffect(() => {
    if (store) {
      loadData();
    }
  }, [store, loadData]);

  const handleCreate = async (payload: CreateShelfPayload) => {
    if (!store) return;
    const res = await shelfApi.create(store.id, warehouseId, payload);
    setShelves((prev) => [res.shelf, ...prev]);
    setAvailableShelves((prev) => Math.max(0, prev - 1));
    setShowCreateModal(false);
  };

  const handleShelfChanged = useCallback(
    async (shelf: Shelf) => {
      if (!store) return;
      try {
        const res = await shelfApi.get(store.id, warehouseId, shelf.id);
        setShelves((prev) =>
          prev.map((s) => (s.id === shelf.id ? res.shelf : s))
        );
      } catch {
        // silent refresh failure
      }
    },
    [store, warehouseId]
  );

  const handleDelete = async (shelf: Shelf) => {
    if (!store) return;
    try {
      await shelfApi.remove(store.id, warehouseId, shelf.id);
      setShelves((prev) => prev.filter((s) => s.id !== shelf.id));
      setAvailableShelves((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete shelf");
    }
  };

  // ---------- Loading / gating states ----------

  if (storeLoading || (loading && !warehouse)) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 flex flex-col items-center justify-center gap-3">
        <div className="h-5 w-5 rounded-full border-2 border-ink/15 border-t-accent animate-spin" />
        <p className="text-sm text-ink/40">Loading…</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <div className="mx-auto max-w-sm text-center border border-line rounded-xl bg-paper px-8 py-10">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
            <svg
              className="h-5 w-5 text-accent"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                d="M3 9.5 12 4l9 5.5V19a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-sm text-ink/60 leading-relaxed">
            You need a store before you can view warehouses.
          </p>
        </div>
      </div>
    );
  }

  const atShelfCapacity = shelfCapacity > 0 && availableShelves <= 0;
  const usageRatio =
    shelfCapacity > 0 ? Math.min(1, shelves.length / shelfCapacity) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <Link
        href="/warehouses"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/45 hover:text-accent transition-colors"
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
        All warehouses
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mt-4 mb-10 pb-8 border-b border-line">
        <div className="min-w-0">
          <h1 className="font-display italic text-3xl text-ink tracking-wide truncate">
            {warehouse?.name ?? "Warehouse"}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <p className="text-sm text-ink/50 whitespace-nowrap">
              {shelves.length} / {shelfCapacity} shelves used
            </p>

            {shelfCapacity > 0 ? (
              <div className="h-1.5 w-28 rounded-full bg-ink/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    atShelfCapacity ? "bg-rust" : "bg-accent"
                  }`}
                  style={{ width: `${usageRatio * 100}%` }}
                />
              </div>
            ) : null}

            {atShelfCapacity ? (
              <span className="text-xs font-medium text-rust">
                At capacity
              </span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          disabled={atShelfCapacity}
          title={
            atShelfCapacity
              ? "This warehouse has reached its shelf capacity"
              : undefined
          }
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
          New shelf
        </button>
      </div>

      {/* Error */}
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

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl border border-line bg-ink/[0.02] animate-pulse"
            />
          ))}
        </div>
      ) : shelves.length === 0 ? (
        <div className="border border-dashed border-line rounded-xl text-center py-20 px-6">
          <div className="mx-auto mb-4 h-11 w-11 rounded-full bg-ink/[0.04] flex items-center justify-center">
            <svg
              className="h-5 w-5 text-ink/35"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path d="M4 4h16M4 10h16M4 16h16" strokeLinecap="round" />
              <path d="M4 4v16M20 4v16" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm text-ink/55 max-w-xs mx-auto leading-relaxed">
            No shelves yet. Create one to start storing products.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            disabled={atShelfCapacity}
            className="mt-5 text-sm font-medium text-accent hover:text-accent/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create your first shelf
          </button>
        </div>
      ) : (
        <ShelfGrid
          shelves={shelves}
          onDeleteShelf={handleDelete}
          onShelfChanged={handleShelfChanged}
        />
      )}

      {showCreateModal ? (
        <CreateShelfModal
          maxSubShelves={maxSubShelves}
          maxProducts={maxProducts}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      ) : null}
    </div>
  );
}