const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/auth");

const {
  createShelf,
  getShelves,
  getShelf,
  updateShelf,
  deleteShelf,
  getShelfOptions,
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

module.exports = router;