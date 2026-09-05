const Store = require("../models/Store");
const Warehouse = require("../models/Warehouse");
const Shelf = require("../models/Shelf");
const SubShelf = require("../models/SubShelf");
const Box = require("../models/Box");

const getStoreForUser = async (userId, storeId) => {
  return await Store.getStoreById(storeId, userId);
};

function toProductNode(product, { level, warehouse, shelf, subShelf, box }) {
  const pathParts = [shelf?.name];
  if (subShelf) pathParts.push(subShelf.name);
  if (box) pathParts.push(box.name);

  const rawId = product.id ?? product.productId;
  const safeId =
    rawId && String(rawId).trim().toLowerCase() !== "undefined"
      ? String(rawId)
      : null;

  const safeName =
    product.name && String(product.name).trim()
      ? product.name
      : product.productId && String(product.productId).trim().toLowerCase() !== "undefined"
      ? String(product.productId)
      : "Unnamed product";

  return {
    id: safeId,
    name: safeName,
    sku: product.sku || null,
    logo: product.logo || null,
    price: product.price,
    quantity: product.quantity,
    level,
    path: pathParts.filter(Boolean).join(" / "),
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    shelfId: shelf?.id || null,
    shelfName: shelf?.name || null,
    subShelfId: subShelf?.id || null,
    subShelfName: subShelf?.name || null,
    boxId: box?.id || null,
    boxName: box?.name || null,
  };
}

exports.getSellOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storeId } = req.params;

    if (!storeId) {
      return res.status(400).json({ error: "Store ID is required" });
    }

    const store = await getStoreForUser(userId, storeId);

    if (!store) {
      return res.status(403).json({
        error: "You do not have access to this store",
      });
    }

    const warehouses = await Warehouse.getWarehouses(storeId);

    const result = await Promise.all(
      warehouses.map(async (warehouse) => {
        const shelves = await Shelf.getShelves(storeId, warehouse.id);

        const shelfNodes = await Promise.all(
          shelves.map(async (shelf) => {
            const [shelfProducts, subShelves] = await Promise.all([
              Shelf.getShelfProducts(storeId, warehouse.id, shelf.id),
              SubShelf.getSubShelves(storeId, warehouse.id, shelf.id),
            ]);

            const subShelfNodes = await Promise.all(
              subShelves.map(async (subShelf) => {
                const [subShelfProducts, boxes] = await Promise.all([
                  SubShelf.getProducts(
                    storeId,
                    warehouse.id,
                    shelf.id,
                    subShelf.id
                  ),
                  Box.getBoxes(storeId, warehouse.id, shelf.id, subShelf.id),
                ]);

                const boxNodes = await Promise.all(
                  boxes.map(async (box) => {
                    const boxProducts = await Box.getProducts(
                      storeId,
                      warehouse.id,
                      shelf.id,
                      subShelf.id,
                      box.id
                    );

                    return {
                      id: box.id,
                      name: box.name,
                      capacity: box.capacity,
                      productQuantity: box.productQuantity,
                      products: boxProducts.map((p) =>
                        toProductNode(p, {
                          level: "box",
                          warehouse,
                          shelf,
                          subShelf,
                          box,
                        })
                      ),
                    };
                  })
                );

                return {
                  id: subShelf.id,
                  name: subShelf.name,
                  capacity: subShelf.capacity,
                  productQuantity: subShelf.productQuantity,
                  products: subShelfProducts.map((p) =>
                    toProductNode(p, {
                      level: "subShelf",
                      warehouse,
                      shelf,
                      subShelf,
                    })
                  ),
                  boxes: boxNodes,
                };
              })
            );

            return {
              id: shelf.id,
              name: shelf.name,
              capacity: shelf.capacity,
              productQuantity: shelf.productQuantity,
              products: shelfProducts.map((p) =>
                toProductNode(p, { level: "shelf", warehouse, shelf })
              ),
              subShelves: subShelfNodes,
            };
          })
        );

        return {
          id: warehouse.id,
          name: warehouse.name,
          shelves: shelfNodes,
        };
      })
    );

    return res.status(200).json({
      success: true,
      warehouses: result,
    });
  } catch (err) {
    console.error("Get sell overview error:", err);

    return res.status(500).json({
      error: err.message || "Failed to get sell overview",
    });
  }
};