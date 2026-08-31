const Store = require("../models/Store");
const Search = require("../models/Search");
const Warehouse = require("../models/Warehouse");
const Shelf = require("../models/Shelf");
const SubShelf = require("../models/SubShelf");
const Box = require("../models/Box");

const getStoreForUser = async (userId, storeId) => {
  return await Store.getStoreById(storeId, userId);
};

exports.searchProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storeId } = req.params;
    const q = String(req.query.q || "").trim();

    if (!storeId) {
      return res.status(400).json({
        error: "Store ID is required",
      });
    }

    if (!q) {
      return res.status(400).json({
        error: "Search query is required",
      });
    }

    const store = await getStoreForUser(userId, storeId);

    if (!store) {
      return res.status(403).json({
        error: "You do not have access to this store",
      });
    }

    const rawMatches = await Search.searchProducts(
      storeId,
      q
    );

    const cache = new Map();

    const cachedGet = async (key, fetcher) => {
      if (cache.has(key)) {
        return cache.get(key);
      }

      const value = await fetcher();
      cache.set(key, value);

      return value;
    };

    const results = await Promise.all(
      rawMatches.map(async (product) => {
        const warehouse = product.warehouseId
          ? await cachedGet(
              `w:${product.warehouseId}`,
              () =>
                Warehouse.getWarehouse(
                  storeId,
                  product.warehouseId
                )
            )
          : null;

        const shelf =
          product.warehouseId && product.shelfId
            ? await cachedGet(
                `s:${product.warehouseId}:${product.shelfId}`,
                () =>
                  Shelf.getShelf(
                    storeId,
                    product.warehouseId,
                    product.shelfId
                  )
              )
            : null;

        const subShelf =
          product.warehouseId &&
          product.shelfId &&
          product.subShelfId
            ? await cachedGet(
                `ss:${product.warehouseId}:${product.shelfId}:${product.subShelfId}`,
                () =>
                  SubShelf.getSubShelf(
                    storeId,
                    product.warehouseId,
                    product.shelfId,
                    product.subShelfId
                  )
              )
            : null;

        const box =
          product.warehouseId &&
          product.shelfId &&
          product.subShelfId &&
          product.boxId
            ? await cachedGet(
                `b:${product.warehouseId}:${product.shelfId}:${product.subShelfId}:${product.boxId}`,
                () =>
                  Box.getBox(
                    storeId,
                    product.warehouseId,
                    product.shelfId,
                    product.subShelfId,
                    product.boxId
                  )
              )
            : null;

        const path = [
          warehouse?.name,
          shelf?.name,
          subShelf?.name,
          box?.name,
        ]
          .filter(Boolean)
          .join(" / ");

        return {
          product: {
            id: product.id,
            name: product.name || null,
            sku: product.sku || null,
            quantity: product.quantity ?? 0,
          },

          location: {
            warehouseId: product.warehouseId,
            warehouseName: warehouse?.name || null,

            shelfId: product.shelfId || null,
            shelfName: shelf?.name || null,

            subShelfId: product.subShelfId || null,
            subShelfName: subShelf?.name || null,

            boxId: product.boxId || null,
            boxName: box?.name || null,
          },

          path,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: results.length,
      query: q,
      results,
    });
  } catch (err) {
    console.error("Search products error:", err);

    return res.status(500).json({
      error: err.message || "Failed to search products",
    });
  }
};