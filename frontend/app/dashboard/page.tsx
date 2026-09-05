"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { getMyStores } from "@/lib/store";
import { getWarehouses } from "@/lib/warehouseApi";
import { getShelfProducts, getShelves, sellProductFromShelf, addProductToShelf } from "@/lib/shelfApi";
import { getSubShelfProducts, getSubShelves, sellSubShelfProduct, addSubShelfProduct } from "@/lib/subshelf";
import { getBoxProducts, getBoxes, sellBoxProduct, addBoxProduct } from "@/lib/box";

import { useStore } from "@/context/StoreContext";
import { ProductInventoryTable, type InventoryRow } from "@/components/dashboard/ProductInventoryTable";
import { StockExitModal } from "@/components/inventory/StockExitModal";

type ProductLevel = "shelf" | "subshelf" | "box";

type DashboardProduct = {
  rowId: string;
  productId: string;
  productName: string;
  sku?: string | null;
  quantity: number;
  level: ProductLevel;
  warehouseId: string;
  warehouseName: string;
  shelfId: string;
  shelfName?: string;
  subShelfId?: string;
  subShelfName?: string;
  boxId?: string;
  boxName?: string;
  location: string;
  sell: (quantity: number) => Promise<void>;
};

export default function DashboardPage() {
  const { store } = useStore();

  const [storeId, setStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState("");

  const [addTarget, setAddTarget] = useState<DashboardProduct | null>(null);
  const [addQuantity, setAddQuantity] = useState("");
  const [adding, setAdding] = useState(false);
  const [exitTarget, setExitTarget] = useState<DashboardProduct | null>(null);

  useEffect(() => {
    getMyStores()
      .then(({ stores }) => setStoreId(stores[0]?.id ?? null))
      .catch(() => setError("Could not load your store."));
  }, []);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadAllProducts() {
      try {
        setLoading(true);
        setError(null);
        const allProducts: DashboardProduct[] = [];
        const warehouseResponse = await getWarehouses(storeId);

        for (const warehouse of warehouseResponse.warehouses) {
          let shelvesResponse;
          try {
            shelvesResponse = await getShelves(storeId, warehouse.id);
          } catch (err) {
            console.error(`Could not load shelves for ${warehouse.name}`, err);
            continue;
          }

          for (const shelf of shelvesResponse.shelves) {
            try {
              const shelfProductsResponse = await getShelfProducts(storeId, warehouse.id, shelf.id);
              shelfProductsResponse.products.forEach((product) => {
                allProducts.push({
                  rowId: `shelf-${warehouse.id}-${shelf.id}-${product.id}`,
                  productId: product.id,
                  productName: product.name ?? "Product",
                  sku: product.sku ?? null,
                  quantity: Number(product.quantity ?? 0),
                  level: "shelf",
                  warehouseId: warehouse.id,
                  warehouseName: warehouse.name,
                  shelfId: shelf.id,
                  shelfName: shelf.name,
                  location: `${warehouse.name} / ${shelf.name}`,
                  sell: async (quantity) => {
                    await sellProductFromShelf(storeId, warehouse.id, shelf.id, product.id, quantity);
                  },
                });
              });
            } catch (err) {
              console.error(`Could not load products from shelf ${shelf.name}`, err);
            }

            let subShelvesResponse;
            try {
              subShelvesResponse = await getSubShelves(storeId, warehouse.id, shelf.id);
            } catch (err) {
              console.error(`Could not load sub-shelves for ${shelf.name}`, err);
              continue;
            }

            for (const subShelf of subShelvesResponse.subShelves) {
              try {
                const subShelfProductsResponse = await getSubShelfProducts(storeId, warehouse.id, shelf.id, subShelf.id);
                subShelfProductsResponse.products.forEach((product) => {
                  allProducts.push({
                    rowId: `subshelf-${warehouse.id}-${shelf.id}-${subShelf.id}-${product.id}`,
                    productId: product.id,
                    productName: product.name ?? "Product",
                    sku: product.sku ?? null,
                    quantity: Number(product.quantity ?? 0),
                    level: "subshelf",
                    warehouseId: warehouse.id,
                    warehouseName: warehouse.name,
                    shelfId: shelf.id,
                    shelfName: shelf.name,
                    subShelfId: subShelf.id,
                    subShelfName: subShelf.name,
                    location: `${warehouse.name} / ${shelf.name} / ${subShelf.name}`,
                    sell: async (quantity) => {
                      await sellSubShelfProduct(storeId, warehouse.id, shelf.id, subShelf.id, product.id, quantity);
                    },
                  });
                });
              } catch (err) {
                console.error(`Could not load products from sub-shelf ${subShelf.name}`, err);
              }

              let boxesResponse;
              try {
                boxesResponse = await getBoxes(storeId, warehouse.id, shelf.id, subShelf.id);
              } catch (err) {
                console.error(`Could not load boxes from ${subShelf.name}`, err);
                continue;
              }

              for (const box of boxesResponse.boxes) {
                try {
                  const boxProductsResponse = await getBoxProducts(storeId, warehouse.id, shelf.id, subShelf.id, box.id);
                  boxProductsResponse.products.forEach((product) => {
                    allProducts.push({
                      rowId: `box-${warehouse.id}-${shelf.id}-${subShelf.id}-${box.id}-${product.id}`,
                      productId: product.id,
                      productName: product.name ?? "Product",
                      sku: product.sku ?? null,
                      quantity: Number(product.quantity ?? 0),
                      level: "box",
                      warehouseId: warehouse.id,
                      warehouseName: warehouse.name,
                      shelfId: shelf.id,
                      shelfName: shelf.name,
                      subShelfId: subShelf.id,
                      subShelfName: subShelf.name,
                      boxId: box.id,
                      boxName: box.name,
                      location: `${warehouse.name} / ${shelf.name} / ${subShelf.name} / ${box.name}`,
                      sell: async (quantity) => {
                        await sellBoxProduct(storeId, warehouse.id, shelf.id, subShelf.id, box.id, product.id, quantity);
                      },
                    });
                  });
                } catch (err) {
                  console.error(`Could not load products from box ${box.name}`, err);
                }
              }
            }
          }
        }

        if (!cancelled) setProducts(allProducts);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load products.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAllProducts();
    return () => {
      cancelled = true;
    };
  }, [storeId, refreshKey]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (product) =>
        product.productName.toLowerCase().includes(query) ||
        product.warehouseName.toLowerCase().includes(query) ||
        product.location.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query)
    );
  }, [products, search]);

  const rows: InventoryRow[] = useMemo(
    () =>
      filteredProducts.map((p) => ({
        rowId: p.rowId,
        warehouseId: p.warehouseId,
        category: p.productName,
        quantity: p.quantity,
      })),
    [filteredProducts]
  );

  const findProduct = (row: InventoryRow) => products.find((p) => p.rowId === row.rowId) ?? null;

  const submitAdd = async () => {
    if (!addTarget || !storeId) return;
    const quantity = Number(addQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return;

    setAdding(true);
    try {
      const payload = { name: addTarget.productName, sku: addTarget.sku ?? undefined, quantity };
      if (addTarget.level === "shelf") {
        await addProductToShelf(storeId, addTarget.warehouseId, addTarget.shelfId, payload);
      } else if (addTarget.level === "subshelf" && addTarget.subShelfId) {
        await addSubShelfProduct(storeId, addTarget.warehouseId, addTarget.shelfId, addTarget.subShelfId, payload);
      } else if (addTarget.level === "box" && addTarget.subShelfId && addTarget.boxId) {
        await addBoxProduct(storeId, addTarget.warehouseId, addTarget.shelfId, addTarget.subShelfId, addTarget.boxId, payload);
      }
      setAddTarget(null);
      setAddQuantity("");
      setRefreshKey((k) => k + 1);
    } finally {
      setAdding(false);
    }
  };

  const submitExit = async (quantity: number) => {
    if (!exitTarget) return;
    await exitTarget.sell(quantity);
    setExitTarget(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
          <div className="border-b border-line px-6 py-6 text-center">
            <h1 className="text-xl font-semibold tracking-wide text-ink">{store?.store_name ?? "Dashboard"}</h1>
          </div>

          {/* SEARCH */}
          <div className="border-b border-line px-6 py-5">
            <div className="mx-auto max-w-md">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products by name or SKU..."
                  className="w-full rounded-full border border-line bg-paper py-3 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-accent"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {loading ? (
            <p className="px-6 py-16 text-center text-sm text-ink/50">Loading products from all warehouses...</p>
          ) : (
            <div className="p-6">
              <ProductInventoryTable
                rows={rows}
                onAdd={(row) => {
                  const product = findProduct(row);
                  if (product) {
                    setAddTarget(product);
                    setAddQuantity("");
                  }
                }}
                onSell={(row) => {
                  const product = findProduct(row);
                  if (product) setExitTarget(product);
                }}
                onTrack={(row) => {
                  console.log("Track product:", row);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ADD QUANTITY MODAL */}
      {addTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-ink">Add Quantity</h2>
            <p className="mt-2 text-sm text-ink/60">{addTarget.productName}</p>
            <p className="mt-1 text-xs text-ink/40">{addTarget.location}</p>
            <input
              type="number"
              min="1"
              autoFocus
              value={addQuantity}
              onChange={(event) => setAddQuantity(event.target.value)}
              placeholder="Enter quantity"
              className="mt-6 w-full rounded-lg border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setAddTarget(null);
                  setAddQuantity("");
                }}
                disabled={adding}
                className="rounded-lg border border-line px-4 py-2 text-sm text-ink/70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAdd}
                disabled={adding}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add Quantity"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELL MODAL */}
      <StockExitModal
        open={exitTarget !== null}
        productName={exitTarget?.productName ?? ""}
        currentQuantity={exitTarget?.quantity ?? 0}
        onClose={() => setExitTarget(null)}
        onSubmit={submitExit}
      />
    </main>
  );
}