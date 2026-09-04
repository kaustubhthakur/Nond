"use client";

import { useEffect, useMemo, useState } from "react";
import { PackagePlus, Search, ShoppingCart } from "lucide-react";

import { getMyStores } from "@/lib/store";
import { getWarehouses } from "@/lib/warehouseApi";

import {
  addProductToShelf,
  getShelfProducts,
  getShelves,
  sellProductFromShelf,
} from "@/lib/shelfApi";

import {
  addSubShelfProduct,
  getSubShelfProducts,
  getSubShelves,
  sellSubShelfProduct,
} from "@/lib/subshelf";

import {
  addBoxProduct,
  getBoxProducts,
  getBoxes,
  sellBoxProduct,
} from "@/lib/box";

import { useStore } from "@/context/StoreContext";
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

type ExitTarget = {
  productId: string;
  name: string;
  quantity: number;
  sell: (quantity: number) => Promise<void>;
};

type AddTarget = {
  product: DashboardProduct;
};

export default function DashboardPage() {
  const { store } = useStore();

  const [storeId, setStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [banner, setBanner] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const [exitTarget, setExitTarget] =
    useState<ExitTarget | null>(null);

  const [addTarget, setAddTarget] =
    useState<AddTarget | null>(null);

  const [addQuantity, setAddQuantity] = useState("");
  const [adding, setAdding] = useState(false);

 
  useEffect(() => {
    getMyStores()
      .then(({ stores }) => {
        setStoreId(stores[0]?.id ?? null);
      })
      .catch(() => {
        setError("Could not load your store.");
      });
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
            shelvesResponse = await getShelves(
              storeId,
              warehouse.id
            );
          } catch (err) {
            console.error(
              `Could not load shelves for ${warehouse.name}`,
              err
            );
            continue;
          }

          for (const shelf of shelvesResponse.shelves) {
           
            try {
              const shelfProductsResponse =
                await getShelfProducts(
                  storeId,
                  warehouse.id,
                  shelf.id
                );

              shelfProductsResponse.products.forEach(
                (product) => {
                  allProducts.push({
                    rowId: `shelf-${warehouse.id}-${shelf.id}-${product.id}`,

                    productId: product.id,

                    productName:
                      product.name ?? "Product",

                    sku:
                      product.sku ?? null,

                    quantity:
                      Number(product.quantity ?? 0),

                    level: "shelf",

                    warehouseId:
                      warehouse.id,

                    warehouseName:
                      warehouse.name,

                    shelfId:
                      shelf.id,

                    shelfName:
                      shelf.name,

                    location:
                      `${warehouse.name} / ${shelf.name}`,

                    sell: async (quantity) => {
                      await sellProductFromShelf(
                        storeId,
                        warehouse.id,
                        shelf.id,
                        product.id,
                        quantity
                      );
                    },
                  });
                }
              );
            } catch (err) {
              console.error(
                `Could not load products from shelf ${shelf.name}`,
                err
              );
            }

          
            let subShelvesResponse;

            try {
              subShelvesResponse =
                await getSubShelves(
                  storeId,
                  warehouse.id,
                  shelf.id
                );
            } catch (err) {
              console.error(
                `Could not load sub-shelves for ${shelf.name}`,
                err
              );
              continue;
            }

            for (
              const subShelf of subShelvesResponse.subShelves
            ) {
            
              try {
                const subShelfProductsResponse =
                  await getSubShelfProducts(
                    storeId,
                    warehouse.id,
                    shelf.id,
                    subShelf.id
                  );

                subShelfProductsResponse.products.forEach(
                  (product) => {
                    allProducts.push({
                      rowId:
                        `subshelf-${warehouse.id}-${shelf.id}-${subShelf.id}-${product.id}`,

                      productId:
                        product.id,

                      productName:
                        product.name ?? "Product",

                      sku:
                        product.sku ?? null,

                      quantity:
                        Number(product.quantity ?? 0),

                      level:
                        "subshelf",

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

                      sell: async (
                        quantity
                      ) => {
                        await sellSubShelfProduct(
                          storeId,
                          warehouse.id,
                          shelf.id,
                          subShelf.id,
                          product.id,
                          quantity
                        );
                      },
                    });
                  }
                );
              } catch (err) {
                console.error(
                  `Could not load products from sub-shelf ${subShelf.name}`,
                  err
                );
              }

              let boxesResponse;

              try {
                boxesResponse =
                  await getBoxes(
                    storeId,
                    warehouse.id,
                    shelf.id,
                    subShelf.id
                  );
              } catch (err) {
                console.error(
                  `Could not load boxes from ${subShelf.name}`,
                  err
                );
                continue;
              }

              for (const box of boxesResponse.boxes) {
                
                try {
                  const boxProductsResponse =
                    await getBoxProducts(
                      storeId,
                      warehouse.id,
                      shelf.id,
                      subShelf.id,
                      box.id
                    );

                  boxProductsResponse.products.forEach(
                    (product) => {
                      allProducts.push({
                        rowId:
                          `box-${warehouse.id}-${shelf.id}-${subShelf.id}-${box.id}-${product.id}`,

                        productId:
                          product.id,

                        productName:
                          product.name ?? "Product",

                        sku:
                          product.sku ?? null,

                        quantity:
                          Number(product.quantity ?? 0),

                        level:
                          "box",

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

                        sell: async (
                          quantity
                        ) => {
                          await sellBoxProduct(
                            storeId,
                            warehouse.id,
                            shelf.id,
                            subShelf.id,
                            box.id,
                            product.id,
                            quantity
                          );
                        },
                      });
                    }
                  );
                } catch (err) {
                  console.error(
                    `Could not load products from box ${box.name}`,
                    err
                  );
                }
              }
            }
          }
        }

        if (!cancelled) {
          setProducts(allProducts);
        }
      } catch (err) {
        console.error(err);

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


  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.productName
          .toLowerCase()
          .includes(query) ||
        product.warehouseName
          .toLowerCase()
          .includes(query) ||
        product.location
          .toLowerCase()
          .includes(query) ||
        product.sku
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [products, search]);

 
  const flash = (message: string) => {
    setBanner(message);

    window.setTimeout(() => {
      setBanner(null);
    }, 3500);
  };

  
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


  const submitAddQuantity = async () => {
    if (!addTarget || !storeId) return;

    const quantity = Number(addQuantity);

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      return;
    }

    const product = addTarget.product;

    setAdding(true);

    try {
      const payload = {
        name: product.productName,
        sku: product.sku ?? undefined,
        quantity,
      };

      /*
       * ADD PRODUCT TO SHELF
       */
      if (product.level === "shelf") {
        await addProductToShelf(
          storeId,
          product.warehouseId,
          product.shelfId,
          payload
        );
      }

      /*
       * ADD PRODUCT TO SUB-SHELF
       */
      if (
        product.level === "subshelf" &&
        product.subShelfId
      ) {
        await addSubShelfProduct(
          storeId,
          product.warehouseId,
          product.shelfId,
          product.subShelfId,
          payload
        );
      }

      /*
       * ADD PRODUCT TO BOX
       */
      if (
        product.level === "box" &&
        product.subShelfId &&
        product.boxId
      ) {
        await addBoxProduct(
          storeId,
          product.warehouseId,
          product.shelfId,
          product.subShelfId,
          product.boxId,
          payload
        );
      }

      flash(
        `Added ${quantity} × "${product.productName}".`
      );

      setAddTarget(null);
      setAddQuantity("");

      setRefreshKey((key) => key + 1);
    } catch (err) {
      console.error(err);

      flash(
        err instanceof Error
          ? err.message
          : "Could not add quantity."
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

        <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">

          {/* STORE HEADER */}
          <div className="border-b border-line px-6 py-6 text-center">
            <h1 className="text-xl font-semibold tracking-wide text-ink">
              {store?.store_name ?? "Dashboard"}
            </h1>

           
          </div>

          {/* SEARCH */}
          <div className="border-b border-line px-6 py-5">
            <div className="mx-auto max-w-md">

              

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search products by name or SKU..."
                  className="w-full rounded-full border border-line bg-paper py-3 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-accent"
                />
              </div>

            </div>
          </div>

          {/* BANNER */}
          {banner && (
            <div className="mx-6 mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {banner}
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mx-6 mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse">

              <thead>
                <tr className="bg-paper">

                  <th className="border-b border-r border-line px-5 py-4 text-left text-sm font-semibold text-ink">
                    Warehouse
                  </th>

                  <th className="border-b border-r border-line px-5 py-4 text-left text-sm font-semibold text-ink">
                    Product
                  </th>

                  <th className="border-b border-r border-line px-5 py-4 text-left text-sm font-semibold text-ink">
                    Location
                  </th>

                  <th className="border-b border-r border-line px-5 py-4 text-center text-sm font-semibold text-ink">
                    Qty. in Stock
                  </th>

                  <th className="border-b border-r border-line px-5 py-4 text-center text-sm font-semibold text-ink">
                    Add Quantity
                  </th>

                  <th className="border-b border-line px-5 py-4 text-center text-sm font-semibold text-ink">
                    Sell Qty
                  </th>

                </tr>
              </thead>

              <tbody>

                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-sm text-ink/50"
                    >
                      Loading products from all warehouses...
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-16 text-center text-sm text-ink/50"
                      >
                        No products found.
                      </td>
                    </tr>
                  )}

                {!loading &&
                  filteredProducts.map((product) => (
                    <tr
                      key={product.rowId}
                      className="transition-colors hover:bg-ink/[0.02]"
                    >

                      {/* WAREHOUSE */}
                      <td className="border-b border-r border-line px-5 py-4">

                        <div className="font-medium text-ink">
                          {product.warehouseName}
                        </div>

                        <div className="mt-1 font-mono text-xs text-ink/40">
                          {product.warehouseId}
                        </div>

                      </td>

                      {/* PRODUCT */}
                      <td className="border-b border-r border-line px-5 py-4">

                        <div className="font-medium text-ink">
                          {product.productName}
                        </div>

                        {product.sku && (
                          <div className="mt-1 text-xs text-ink/40">
                            SKU: {product.sku}
                          </div>
                        )}

                      </td>

                      {/* LOCATION */}
                      <td className="border-b border-r border-line px-5 py-4">

                        <span className="text-sm text-ink/70">
                          {product.location}
                        </span>

                      </td>

                      {/* QUANTITY */}
                      <td className="border-b border-r border-line px-5 py-4 text-center">

                        <span className="rounded-md bg-ink/5 px-3 py-1.5 text-sm font-semibold text-ink">
                          {product.quantity}
                        </span>

                      </td>

                      {/* ADD QUANTITY */}
                      <td className="border-b border-r border-line px-5 py-4 text-center">

                        <button
                          type="button"
                          onClick={() => {
                            setAddTarget({
                              product,
                            });

                            setAddQuantity("");
                          }}
                          className="inline-flex min-w-[145px] items-center justify-center gap-2 rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                        >
                          <PackagePlus className="h-4 w-4" />

                          Add Quantity
                        </button>

                      </td>

                      {/* SELL */}
                      <td className="border-b border-line px-5 py-4 text-center">

                        <button
                          type="button"
                          onClick={() => {
                            setExitTarget({
                              productId:
                                product.productId,

                              name:
                                product.productName,

                              quantity:
                                product.quantity,

                              sell:
                                product.sell,
                            });
                          }}
                          className="inline-flex min-w-[110px] items-center justify-center gap-2 rounded-lg border border-red-400 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
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
      {addTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">

          <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-6 shadow-xl">

            <h2 className="text-lg font-semibold text-ink">
              Add Quantity
            </h2>

            <p className="mt-2 text-sm text-ink/60">
              {addTarget.product.productName}
            </p>

            <p className="mt-1 text-xs text-ink/40">
              {addTarget.product.location}
            </p>

            <input
              type="number"
              min="1"
              autoFocus
              value={addQuantity}
              onChange={(event) =>
                setAddQuantity(event.target.value)
              }
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
                onClick={submitAddQuantity}
                disabled={adding}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {adding
                  ? "Adding..."
                  : "Add Quantity"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* SELL MODAL */}
      <StockExitModal
        open={exitTarget !== null}
        productName={exitTarget?.name ?? ""}
        currentQuantity={
          exitTarget?.quantity ?? 0
        }
        onClose={() =>
          setExitTarget(null)
        }
        onSubmit={submitExit}
      />

    </main>
  );
}