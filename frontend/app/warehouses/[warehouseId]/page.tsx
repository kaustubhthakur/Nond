"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { warehouseApi } from "@/lib/warehouseApi";
import { shelfApi } from "@/lib/shelfApi";
import { ApiError } from "@/types/auth";
import { Warehouse } from "@/types/warehouse";
import { CreateShelfPayload, Shelf, AddProductToShelfPayload } from "@/types/shelf";
import { ShelfCard } from "@/components/warehouses/ShelfCard";
import { CreateShelfModal } from "@/components/warehouses/CreateShelfModal";
import { AddProductModal } from "@/components/warehouses/AddProductModal";

export default function WarehouseShelvesPage() {
  const { store, isLoading: storeLoading } = useStore();
  const params = useParams<{ warehouseId: string }>();
  const router = useRouter();
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
  const [productModalShelf, setProductModalShelf] = useState<Shelf | null>(
    null
  );

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

  const handleAddProduct = async (payload: AddProductToShelfPayload) => {
    if (!store || !productModalShelf) return;

    await shelfApi.addProduct(
      store.id,
      warehouseId,
      productModalShelf.id,
      payload
    );

    // Mirror the backend's own math (productQuantity += qty,
    // availableCapacity = capacity - productQuantity) so the card updates
    // instantly without a second round trip.
    setShelves((prev) =>
      prev.map((s) =>
        s.id === productModalShelf.id
          ? {
              ...s,
              productQuantity: s.productQuantity + payload.quantity,
              availableCapacity: s.availableCapacity - payload.quantity,
            }
          : s
      )
    );

    setProductModalShelf(null);
  };

  const handleAddSubShelf = (shelf: Shelf) => {
    router.push(`/warehouses/${warehouseId}/shelves/${shelf.id}`);
  };

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

  if (storeLoading || (loading && !warehouse)) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center text-sm text-ink/50">
        Loading…
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center text-sm text-ink/50">
        You need a store before you can view warehouses.
      </div>
    );
  }

  const atShelfCapacity = shelfCapacity > 0 && availableShelves <= 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/warehouses"
        className="text-xs text-ink/50 hover:text-accent transition-colors"
      >
        ← All warehouses
      </Link>

      <div className="flex items-center justify-between mt-3 mb-8">
        <div>
          <h1 className="font-display italic text-2xl text-ink tracking-wide">
            {warehouse?.name ?? "Warehouse"}
          </h1>
          <p className="text-sm text-ink/50 mt-1">
            {shelves.length} / {shelfCapacity} shelves used
            {atShelfCapacity ? " — at capacity" : ""}
          </p>
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
          className="eyebrow border border-accent bg-accent text-paper px-4 py-2 hover:bg-transparent hover:text-accent transition-colors disabled:opacity-50"
        >
          + New shelf
        </button>
      </div>

      {error ? (
        <div className="border border-rust/40 bg-rust/5 text-rust text-sm px-4 py-3 mb-6">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-center text-sm text-ink/50 py-16">
          Loading shelves…
        </div>
      ) : shelves.length === 0 ? (
        <div className="border border-dashed border-line text-center py-16 px-6">
          <p className="text-sm text-ink/60">
            No shelves yet. Create one to start storing products.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shelves.map((shelf) => (
            <ShelfCard
              key={shelf.id}
              shelf={shelf}
              onDelete={handleDelete}
              onAddProduct={setProductModalShelf}
              onAddSubShelf={handleAddSubShelf}
            />
          ))}
        </div>
      )}

      {showCreateModal ? (
        <CreateShelfModal
          maxSubShelves={maxSubShelves}
          maxProducts={maxProducts}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      ) : null}

      {productModalShelf ? (
        <AddProductModal
          shelfName={productModalShelf.name}
          availableCapacity={productModalShelf.availableCapacity}
          onClose={() => setProductModalShelf(null)}
          onAdd={handleAddProduct}
        />
      ) : null}
    </div>
  );
}