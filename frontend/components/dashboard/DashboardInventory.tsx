"use client";

import { useEffect, useState } from "react";

import { getMyStores } from "@/lib/store";
import { getWarehouses } from "@/lib/warehouseApi";
import { getShelfProducts, getShelves, sellProductFromShelf } from "@/lib/shelfApi";
import { getSubShelfProducts, getSubShelves, sellSubShelfProduct } from "@/lib/subshelf";
import { getBoxProducts, getBoxes, sellBoxProduct } from "@/lib/box";

import { ProductInventorySection, type DashboardProduct } from "@/components/dashboard/ProductInventorySection";

export function DashboardInventory() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
      {error && (
        <div className="mx-6 mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ProductInventorySection
        storeId={storeId}
        products={products}
        loading={loading}
        onChanged={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}