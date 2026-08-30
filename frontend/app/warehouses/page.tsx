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

  if (storeLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center text-sm text-ink/50">
        Loading store…
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center text-sm text-ink/50">
        You need a store before you can add warehouses.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display italic text-2xl text-ink tracking-wide">
            Warehouses
          </h1>
          <p className="text-sm text-ink/50 mt-1">
            {warehouses.length} warehouse{warehouses.length === 1 ? "" : "s"}{" "}
            for {store.store_name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          disabled={shelfCapacityOptions.length === 0}
          className="eyebrow border border-accent bg-accent text-paper px-4 py-2 hover:bg-transparent hover:text-accent transition-colors disabled:opacity-50"
        >
          + New warehouse
        </button>
      </div>

      {error ? (
        <div className="border border-rust/40 bg-rust/5 text-rust text-sm px-4 py-3 mb-6">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-center text-sm text-ink/50 py-16">
          Loading warehouses…
        </div>
      ) : warehouses.length === 0 ? (
        <div className="border border-dashed border-line text-center py-16 px-6">
          <p className="text-sm text-ink/60">
            No warehouses yet. Create one to start organizing shelves,
            sub-shelves, and boxes.
          </p>
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