const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/auth");

const {
  createSubShelf,
  getSubShelves,
  getSubShelf,
  updateSubShelf,
  deleteSubShelf,
  getSubShelfOptions,
} = require("../controllers/subshelf");

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

module.exports = router;