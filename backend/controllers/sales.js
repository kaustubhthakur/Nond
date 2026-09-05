const Sale = require("../models/Sale");
const Store = require("../models/Store");

const getStoreForUser = async (userId, storeId) => {
  return await Store.getStoreById(storeId, userId);
};

exports.createSale = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storeId } = req.params;

    const {
      warehouseId,
      warehouseName,
      level,
      shelfId,
      shelfName,
      subShelfId,
      subShelfName,
      boxId,
      boxName,
      productId,
      productName,
      sku,
      price,
      quantity,
    } = req.body;

    if (!storeId) {
      return res.status(400).json({ error: "Store ID is required" });
    }

    const store = await getStoreForUser(userId, storeId);

    if (!store) {
      return res.status(403).json({
        error: "You do not have access to this store",
      });
    }

    if (!warehouseId) {
      return res.status(400).json({ error: "Warehouse ID is required" });
    }

    if (!["shelf", "subShelf", "box"].includes(level)) {
      return res.status(400).json({
        error: "level must be one of shelf, subShelf, box",
      });
    }

    if (typeof productName !== "string" || !productName.trim()) {
      return res.status(400).json({ error: "Product name is required" });
    }

    const numericPrice = Number(price);
    const numericQuantity = Number(quantity);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        error: "Price must be a non-negative number",
      });
    }

    if (!Number.isInteger(numericQuantity) || numericQuantity <= 0) {
      return res.status(400).json({
        error: "Quantity must be a positive integer",
      });
    }

    const sale = await Sale.createSale({
      storeId,
      warehouseId,
      warehouseName,
      level,
      shelfId,
      shelfName,
      subShelfId,
      subShelfName,
      boxId,
      boxName,
      productId,
      productName: productName.trim(),
      sku,
      price: numericPrice,
      quantity: numericQuantity,
      soldBy: req.user.username || req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Sale recorded successfully",
      sale,
    });
  } catch (err) {
    console.error("Create sale error:", err);

    return res.status(500).json({
      error: err.message || "Failed to record sale",
    });
  }
};

exports.getSales = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storeId } = req.params;
    const limit = req.query.limit ? Number(req.query.limit) : 100;

    if (!storeId) {
      return res.status(400).json({ error: "Store ID is required" });
    }

    const store = await getStoreForUser(userId, storeId);

    if (!store) {
      return res.status(403).json({
        error: "You do not have access to this store",
      });
    }

    const sales = await Sale.getSales(storeId, limit);

    return res.status(200).json({
      success: true,
      count: sales.length,
      sales,
    });
  } catch (err) {
    console.error("Get sales error:", err);

    return res.status(500).json({
      error: err.message || "Failed to get sales",
    });
  }
};