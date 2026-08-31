"use client";

import { useEffect, useState } from "react";
import { PackagePlus, Search, ShoppingCart } from "lucide-react";

import { getMyStores } from "@/lib/store";
import { getWarehouses } from "@/lib/warehouseApi";

import {
  getShelves,
  sellProductFromShelf,
} from "@/lib/shelfApi";

import {
  addSubShelfProduct,
  getSubShelves,
  getSubShelfProducts,
  sellSubShelfProduct,
} from "@/lib/subshelf";

import {
  addBoxProduct,
  getBoxes,
  getBoxProducts,
  sellBoxProduct,
} from "@/lib/box";

import type { SearchResult } from "@/types/search";

import { useStore } from "@/context/StoreContext";

import { GlobalSearch } from "@/components/inventory/GlobalSearch";
import { StockExitModal } from "@/components/inventory/StockExitModal";
import { StockEntryModal } from "@/components/inventory/StockEntryModal";

type ExitTarget = {
  productId: string;
  name: string;
  quantity: number;
  sell: (quantity: number) => Promise<void>;
};

type EntryTarget = {
  level: "subShelf" | "box";

  productName: string;

  warehouseId: string;
  shelfId: string;

  subShelfId: string;
  boxId?: string;

  label: string;
};

type DashboardProduct = {
  rowId: string;

  productId: string;
  productName: string;
  sku?: string;

  quantity: number;

  warehouseId: string;
  warehouseName: string;

  shelfId: string;
  shelfName: string;

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

  const [products, setProducts] =
    useState<DashboardProduct[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [banner, setBanner] =
    useState<string | null>(null);

  const [refreshKey, setRefreshKey] =
    useState(0);

  const [exitTarget, setExitTarget] =
    useState<ExitTarget | null>(null);

  const [entryTarget, setEntryTarget] =
    useState<EntryTarget | null>(null);

  /*
   * Get current store ID
   */
  useEffect(() => {
    getMyStores()
      .then(({ stores }) => {
        setStoreId(stores[0]?.id ?? null);
      })
      .catch(() => {
        setError("Could not load your store.");
      });
  }, []);

  /*
   * Load every product from every warehouse
   */
  useEffect(() => {
    if (!storeId) return;

    let cancelled = false;

    async function loadAllProducts() {
      try {
        setLoading(true);
        setError(null);

        const allProducts: DashboardProduct[] = [];

        /*
         * Get all warehouses
         */
        const { warehouses } =
          await getWarehouses(storeId);

        /*
         * Loop warehouses
         */
        for (const warehouse of warehouses) {
          const { shelves } =
            await getShelves(
              storeId,
              warehouse.id
            );

          /*
           * Loop shelves
           */
          for (const shelf of shelves) {
            const { subShelves } =
              await getSubShelves(
                storeId,
                warehouse.id,
                shelf.id
              );

            /*
             * Loop sub-shelves
             */
            for (const subShelf of subShelves) {
              /*
               * Products directly in sub-shelf
               */
              const {
                products: subShelfProducts,
              } = await getSubShelfProducts(
                storeId,
                warehouse.id,
                shelf.id,
                subShelf.id
              );

              subShelfProducts.forEach(
                (product) => {
                  allProducts.push({
                    rowId: `${warehouse.id}-${shelf.id}-${subShelf.id}-${product.id}`,

                    productId: product.id,

                    productName:
                      product.name ?? "Product",

                    sku: product.sku,

                    quantity:
                      product.quantity,

                    warehouseId:
                      warehouse.id,

                    warehouseName:
                      warehouse.name,

                    shelfId:
                      shelf.id,

                    shelfName:
                      shelf.name,

                    subShelfId:
                      subShelf.id,

                    subShelfName:
                      subShelf.name,

                    location:
                      `${warehouse.name} / ${shelf.name} / ${subShelf.name}`,

                    sell: async (qty) => {
                      await sellSubShelfProduct(
                        storeId,
                        warehouse.id,
                        shelf.id,
                        subShelf.id,
                        product.id,
                        qty
                      );
                    },
                  });
                }
              );

              /*
               * Get boxes
               */
              const { boxes } =
                await getBoxes(
                  storeId,
                  warehouse.id,
                  shelf.id,
                  subShelf.id
                );

              /*
               * Loop boxes
               */
              for (const box of boxes) {
                const {
                  products: boxProducts,
                } = await getBoxProducts(
                  storeId,
                  warehouse.id,
                  shelf.id,
                  subShelf.id,
                  box.id
                );

                boxProducts.forEach(
                  (product) => {
                    allProducts.push({
                      rowId: `${warehouse.id}-${shelf.id}-${subShelf.id}-${box.id}-${product.id}`,

                      productId:
                        product.id,

                      productName:
                        product.name ?? "Product",

                      sku:
                        product.sku,

                      quantity:
                        product.quantity,

                      warehouseId:
                        warehouse.id,

                      warehouseName:
                        warehouse.name,

                      shelfId:
                        shelf.id,

                      shelfName:
                        shelf.name,

                      subShelfId:
                        subShelf.id,

                      subShelfName:
                        subShelf.name,

                      boxId:
                        box.id,

                      boxName:
                        box.name,

                      location:
                        `${warehouse.name} / ${shelf.name} / ${subShelf.name} / ${box.name}`,

                      sell: async (qty) => {
                        await sellBoxProduct(
                          storeId,
                          warehouse.id,
                          shelf.id,
                          subShelf.id,
                          box.id,
                          product.id,
                          qty
                        );
                      },
                    });
                  }
                );
              }
            }
          }
        }

        if (!cancelled) {
          setProducts(allProducts);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load products."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAllProducts();

    return () => {
      cancelled = true;
    };
  }, [storeId, refreshKey]);

  const flash = (message: string) => {
    setBanner(message);

    setTimeout(() => {
      setBanner(null);
    }, 3500);
  };

  /*
   * Sell from search
   */
  const openExitForSearchResult = (
    result: SearchResult
  ) => {
    if (!storeId) return;

    const { location } = result;

    let sell:
      | ((quantity: number) => Promise<void>)
      | undefined;

    if (
      location.boxId &&
      location.subShelfId &&
      location.shelfId
    ) {
      sell = async (qty) => {
        await sellBoxProduct(
          storeId,
          location.warehouseId,
          location.shelfId,
          location.subShelfId,
          location.boxId,
          result.product.id,
          qty
        );
      };
    } else if (
      location.subShelfId &&
      location.shelfId
    ) {
      sell = async (qty) => {
        await sellSubShelfProduct(
          storeId,
          location.warehouseId,
          location.shelfId,
          location.subShelfId,
          result.product.id,
          qty
        );
      };
    } else if (location.shelfId) {
      sell = async (qty) => {
        await sellProductFromShelf(
          storeId,
          location.warehouseId,
          location.shelfId,
          result.product.id,
          qty
        );
      };
    }

    if (!sell) return;

    setExitTarget({
      productId: result.product.id,
      name: result.product.name ?? "Product",
      quantity: result.product.quantity,
      sell,
    });
  };

  /*
   * Submit Sell
   */
  const submitExit = async (
    quantity: number
  ) => {
    if (!exitTarget) return;

    await exitTarget.sell(quantity);

    flash(
      `Removed ${quantity} × "${exitTarget.name}".`
    );

    setExitTarget(null);

    setRefreshKey((key) => key + 1);
  };

  /*
   * Submit Add Quantity
   */
  const submitEntry = async (
    payload: {
      name: string;
      sku?: string;
      quantity: number;
    }
  ) => {
    if (!entryTarget || !storeId) return;

    /*
     * Add to Box
     */
    if (
      entryTarget.level === "box" &&
      entryTarget.boxId
    ) {
      await addBoxProduct(
        storeId,
        entryTarget.warehouseId,
        entryTarget.shelfId,
        entryTarget.subShelfId,
        entryTarget.boxId,
        payload
      );
    }

    /*
     * Add to Sub-shelf
     */
    else if (
      entryTarget.level === "subShelf"
    ) {
      await addSubShelfProduct(
        storeId,
        entryTarget.warehouseId,
        entryTarget.shelfId,
        entryTarget.subShelfId,
        payload
      );
    }

    flash(
      `Added ${payload.quantity} × "${payload.name}".`
    );

    setEntryTarget(null);

    /*
     * Reload master table
     */
    setRefreshKey((key) => key + 1);
  };

  return (
    <main className="min-h-screen bg-[#f7f7f6] px-3 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">

        <div className="overflow-visible rounded-2xl border border-zinc-300 bg-white shadow-sm">

          {/* TITLE */}
          <header className="border-b border-zinc-300">

            <div className="border-b border-zinc-300 px-6 py-5 text-center">

              <h1 className="text-lg font-semibold tracking-wide text-zinc-800">
                {store?.store_name ?? "Dashboard"}
              </h1>

             

            </div>

           
            <div className="relative z-50 bg-[#fafafa] px-4 py-5 sm:px-8">

              <div className="mx-auto max-w-md">

                
                {storeId && (
                  <GlobalSearch
                    storeId={storeId}
                    onSell={openExitForSearchResult}
                  />
                )}

              </div>

            </div>

          </header>

          {/* SUCCESS MESSAGE */}
          {banner && (
            <div className="mx-4 mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 sm:mx-6">
              {banner}
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* MASTER PRODUCT TABLE */}
          <div className="mt-5 overflow-x-auto">

            <table className="w-full min-w-[1000px] border-collapse">

              <thead>
                <tr className="bg-zinc-50">

                  <th className="border-b border-r border-zinc-300 px-5 py-4 text-left text-sm font-semibold text-zinc-700">
                    Warehouse
                  </th>

                  <th className="border-b border-r border-zinc-300 px-5 py-4 text-left text-sm font-semibold text-zinc-700">
                    Product
                  </th>

                  <th className="border-b border-r border-zinc-300 px-5 py-4 text-left text-sm font-semibold text-zinc-700">
                    Location
                  </th>

                  <th className="border-b border-r border-zinc-300 px-5 py-4 text-center text-sm font-semibold text-zinc-700">
                    Qty. in Stock
                  </th>

                  <th className="border-b border-r border-zinc-300 px-5 py-4 text-center text-sm font-semibold text-zinc-700">
                    Add Quantity
                  </th>

                  <th className="border-b border-zinc-300 px-5 py-4 text-center text-sm font-semibold text-zinc-700">
                    Sell Qty
                  </th>

                </tr>
              </thead>

              <tbody>

                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-sm text-zinc-500"
                    >
                      Loading all products from all warehouses...
                    </td>
                  </tr>
                )}

                {!loading &&
                  products.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-16 text-center text-sm text-zinc-400"
                      >
                        No products found in any warehouse.
                      </td>
                    </tr>
                  )}

                {!loading &&
                  products.map((product) => (
                    <tr
                      key={product.rowId}
                      className="transition-colors hover:bg-zinc-50"
                    >

                      {/* WAREHOUSE */}
                      <td className="border-b border-r border-zinc-200 px-5 py-4">

                        <div className="font-medium text-zinc-800">
                          {product.warehouseName}
                        </div>

                        <div className="mt-1 font-mono text-xs text-zinc-400">
                          {product.warehouseId}
                        </div>

                      </td>

                      {/* PRODUCT */}
                      <td className="border-b border-r border-zinc-200 px-5 py-4">

                        <div className="font-medium text-zinc-800">
                          {product.productName}
                        </div>

                        {product.sku && (
                          <div className="mt-1 text-xs text-zinc-400">
                            SKU: {product.sku}
                          </div>
                        )}

                      </td>

                      {/* LOCATION */}
                      <td className="border-b border-r border-zinc-200 px-5 py-4">

                        <span className="text-sm text-zinc-600">
                          {product.location}
                        </span>

                      </td>

                      {/* QUANTITY */}
                      <td className="border-b border-r border-zinc-200 px-5 py-4 text-center">

                        <span className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-800">
                          {product.quantity}
                        </span>

                      </td>

                      {/* ADD QUANTITY */}
                      <td className="border-b border-r border-zinc-200 px-5 py-4 text-center">

                        <button
                          type="button"
                          onClick={() => {
                            if (!product.subShelfId) return;

                            setEntryTarget({
                              level: product.boxId
                                ? "box"
                                : "subShelf",

                              productName:
                                product.productName,

                              warehouseId:
                                product.warehouseId,

                              shelfId:
                                product.shelfId,

                              subShelfId:
                                product.subShelfId,

                              boxId:
                                product.boxId,

                              label:
                                product.boxName ??
                                product.subShelfName ??
                                "Location",
                            });
                          }}
                          className="inline-flex min-w-[125px] items-center justify-center gap-2 rounded-lg border border-emerald-500 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                        >
                          <PackagePlus className="h-4 w-4" />

                          Add Quantity
                        </button>

                      </td>

                      {/* SELL */}
                      <td className="border-b border-zinc-200 px-5 py-4 text-center">

                        <button
                          type="button"
                          onClick={() =>
                            setExitTarget({
                              productId:
                                product.productId,

                              name:
                                product.productName,

                              quantity:
                                product.quantity,

                              sell:
                                product.sell,
                            })
                          }
                          className="inline-flex min-w-[110px] items-center justify-center gap-2 rounded-lg border border-red-400 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          <ShoppingCart className="h-4 w-4" />

                          Sell
                        </button>

                      </td>

                    </tr>
                  ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* ADD QUANTITY MODAL */}
      <StockEntryModal
        open={entryTarget !== null}
        targetLabel={entryTarget?.label ?? ""}
        onClose={() => setEntryTarget(null)}
        onSubmit={submitEntry}
      />

      {/* SELL MODAL */}
      <StockExitModal
        open={exitTarget !== null}
        productName={exitTarget?.name ?? ""}
        currentQuantity={exitTarget?.quantity ?? 0}
        onClose={() => setExitTarget(null)}
        onSubmit={submitExit}
      />

    </main>
  );
}