const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/auth");

const {
  createShelf,
  getShelves,
  getShelf,
  updateShelf,
  deleteShelf,
  getShelfOptions,
  addProductToShelf,
  sellProductFromShelf,
  getShelfProducts,
  getShelfProduct,
} = require("../controllers/shelfs");

router.get(
  "/options",
  verifyToken,
  getShelfOptions
);

router.post(
  "/store/:storeId/warehouse/:warehouseId",
  verifyToken,
  createShelf
);

router.get(
  "/store/:storeId/warehouse/:warehouseId",
  verifyToken,
  getShelves
);

router.get(
  "/store/:storeId/warehouse/:warehouseId/:shelfId",
  verifyToken,
  getShelf
);

router.put(
  "/store/:storeId/warehouse/:warehouseId/:shelfId",
  verifyToken,
  updateShelf
);

router.delete(
  "/store/:storeId/warehouse/:warehouseId/:shelfId",
  verifyToken,
  deleteShelf
);

router.post(
  "/store/:storeId/warehouse/:warehouseId/:shelfId/product",
  verifyToken,
  addProductToShelf
);

router.get(
  "/store/:storeId/warehouse/:warehouseId/:shelfId/products",
  verifyToken,
  getShelfProducts
);

router.get(
  "/store/:storeId/warehouse/:warehouseId/:shelfId/product/:productId",
  verifyToken,
  getShelfProduct
);

// Subtract stock from a product on this shelf — e.g. when it's sold.
router.post(
  "/store/:storeId/warehouse/:warehouseId/:shelfId/product/:productId/sell",
  verifyToken,
  sellProductFromShelf
);

module.exports = router;