const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/auth");

const {
  createSubShelf,
  getSubShelves,
  getSubShelf,
  updateSubShelf,
  deleteSubShelf,
  addProduct,
  getSubShelfProducts,
  getSubShelfOptions,
} = require("../controllers/subshelfs");

router.get(
  "/options",
  verifyToken,
  getSubShelfOptions
);

router.post(
  "/store/:storeId/warehouse/:warehouseId/shelf/:shelfId",
  verifyToken,
  createSubShelf
);

router.get(
  "/store/:storeId/warehouse/:warehouseId/shelf/:shelfId",
  verifyToken,
  getSubShelves
);

router.get(
  "/store/:storeId/warehouse/:warehouseId/shelf/:shelfId/:subShelfId",
  verifyToken,
  getSubShelf
);

router.put(
  "/store/:storeId/warehouse/:warehouseId/shelf/:shelfId/:subShelfId",
  verifyToken,
  updateSubShelf
);

router.delete(
  "/store/:storeId/warehouse/:warehouseId/shelf/:shelfId/:subShelfId",
  verifyToken,
  deleteSubShelf
);

// Add a product directly onto a sub-shelf (no box involved)
router.post(
  "/store/:storeId/warehouse/:warehouseId/shelf/:shelfId/:subShelfId/products",
  verifyToken,
  addProduct
);

router.get(
  "/store/:storeId/warehouse/:warehouseId/shelf/:shelfId/:subShelfId/products",
  verifyToken,
  getSubShelfProducts
);

module.exports = router;