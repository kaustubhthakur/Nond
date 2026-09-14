"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { warehouseApi } from "@/lib/warehouseApi";
import { ApiError } from "@/types/auth";
import { CreateWarehousePayload, Warehouse } from "@/types/warehouse";
import { WarehouseCard } from "@/components/warehouses/WarehouseCard";
import { CreateWarehouseModal } from "@/components/warehouses/CreateWarehouseModal";

export default function WarehousesPage() {
  const { store, isLoading: storeLoading } = useStore();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [shelfCapacityOptions, setShelfCapacityOptions] = useState<number[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!store) return;

    setLoading(true);
    setError(null);

    try {
      const [warehousesRes, optionsRes] = await Promise.all([
        warehouseApi.list(store.id),
        warehouseApi.getOptions(),
      ]);

      setWarehouses(warehousesRes.warehouses);
      setShelfCapacityOptions(optionsRes.shelfCapacityOptions);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load warehouses"
      );
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    if (store) {
      loadData();
    }
  }, [store, loadData]);

  const handleCreate = async (payload: CreateWarehousePayload) => {
    const res = await warehouseApi.create(payload);
    setWarehouses((prev) => [res.warehouse, ...prev]);
    setShowCreateModal(false);
  };

  const handleDelete = async (warehouse: Warehouse) => {
    try {
      await warehouseApi.remove(warehouse.storeId, warehouse.id);
      setWarehouses((prev) => prev.filter((w) => w.id !== warehouse.id));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete warehouse"
      );
    }
  };

  // ---------- Loading / gating states ----------

  if (storeLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24 flex flex-col items-center justify-center gap-3">
        <div className="h-5 w-5 rounded-full border-2 border-ink/15 border-t-accent animate-spin" />
        <p className="text-sm text-ink/40">Loading store…</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24">
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
            You need a store before you can add warehouses.
          </p>
        </div>
      </div>
    );
  }

  const shelfOptionsReady = shelfCapacityOptions.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10 pb-8 border-b border-line">
        <div>
          <h1 className="font-display italic text-3xl text-ink tracking-wide">
            Warehouses
          </h1>
          <p className="text-sm text-ink/50 mt-2">
            {loading
              ? "Loading…"
              : `${warehouses.length} warehouse${
                  warehouses.length === 1 ? "" : "s"
                } for ${store.store_name}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          disabled={!shelfOptionsReady}
          title={
            shelfOptionsReady
              ? undefined
              : "Loading shelf capacity options…"
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
          New warehouse
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl border border-line bg-ink/[0.02] animate-pulse"
            />
          ))}
        </div>
      ) : warehouses.length === 0 ? (
        <div className="border border-dashed border-line rounded-xl text-center py-20 px-6">
          <div className="mx-auto mb-4 h-11 w-11 rounded-full bg-ink/[0.04] flex items-center justify-center">
            <svg
              className="h-5 w-5 text-ink/35"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <rect x="3" y="7" width="18" height="13" rx="1.5" />
              <path d="M3 7 6 3h12l3 4M9 11v3M15 11v3" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm text-ink/55 max-w-xs mx-auto leading-relaxed">
            No warehouses yet. Create one to start organizing shelves,
            sub-shelves, and boxes.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            disabled={!shelfOptionsReady}
            className="mt-5 text-sm font-medium text-accent hover:text-accent/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create your first warehouse
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {warehouses.map((warehouse) => (
            <WarehouseCard
              key={warehouse.id}
              warehouse={warehouse}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showCreateModal ? (
        <CreateWarehouseModal
          storeId={store.id}
          shelfCapacityOptions={shelfCapacityOptions}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      ) : null}
    </div>
  );
}