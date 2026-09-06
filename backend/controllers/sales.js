const Sale = require("../models/Sale");
const Store = require("../models/Store");

const getStoreForUser = async (userId, storeId) => {
  return await Store.getStoreById(storeId, userId);
};

const LEVELS = ["shelf", "subShelf", "box"];

function validateItem(item, index) {
  if (!item || typeof item !== "object") {
    return `Item ${index + 1} is invalid`;
  }
  if (!item.warehouseId) {
    return `Item ${index + 1} is missing a warehouse ID`;
  }
  if (!LEVELS.includes(item.level)) {
    return `Item ${index + 1} has an invalid level`;
  }
  if (typeof item.productName !== "string" || !item.productName.trim()) {
    return `Item ${index + 1} is missing a product name`;
  }
  const price = Number(item.price);
  const quantity = Number(item.quantity);
  if (!Number.isFinite(price) || price < 0) {
    return `Item ${index + 1} has an invalid price`;
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return `Item ${index + 1} has an invalid quantity`;
  }
  return null;
}


exports.createSale = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storeId } = req.params;
    const { items, soldAt } = req.body;

    if (!storeId) {
      return res.status(400).json({ error: "Store ID is required" });
    }

    const store = await getStoreForUser(userId, storeId);
    if (!store) {
      return res.status(403).json({ error: "You do not have access to this store" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "At least one item is required" });
    }

    for (let i = 0; i < items.length; i++) {
      const error = validateItem(items[i], i);
      if (error) return res.status(400).json({ error });
    }

    let resolvedSoldAt;
    if (soldAt) {
      const parsed = new Date(soldAt);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: "soldAt must be a valid date" });
      }
      resolvedSoldAt = parsed;
    }

    const sale = await Sale.createSale({
      storeId,
      items: items.map((item) => ({
        ...item,
        productName: item.productName.trim(),
      })),
      soldBy: req.user.username || req.user.id,
      soldAt: resolvedSoldAt,
    });

    return res.status(201).json({
      success: true,
      message: "Sale recorded successfully",
      sale,
    });
  } catch (err) {
    console.error("Create sale error:", err);
    return res.status(500).json({ error: err.message || "Failed to record sale" });
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
      return res.status(403).json({ error: "You do not have access to this store" });
    }

    const sales = await Sale.getSales(storeId, limit);
    return res.status(200).json({ success: true, count: sales.length, sales });
  } catch (err) {
    console.error("Get sales error:", err);
    return res.status(500).json({ error: err.message || "Failed to get sales" });
  }
};