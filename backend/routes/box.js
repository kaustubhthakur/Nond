const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/auth");

const {
  createBox,
  getBoxes,
  getBox,
  updateBox,
  deleteBox,
  getBoxOptions,
} = require("../controllers/box");

router.get(
  "/options",
  verifyToken,
  getBoxOptions
);

router.post(
  "/store/:storeId/warehouse/:warehouseId/shelf/:shelfId/sub-shelf/:subShelfId",
  verifyToken,
  createBox
);

router.get(
  "/store/:storeId/warehouse/:warehouseId/shelf/:shelfId/sub-shelf/:subShelfId",
  verifyToken,
  getBoxes
);

router.get(
  "/store/:storeId/warehouse/:warehouseId/shelf/:shelfId/sub-shelf/:subShelfId/:boxId",
  verifyToken,
  getBox
);

router.put(
  "/store/:storeId/warehouse/:warehouseId/shelf/:shelfId/sub-shelf/:subShelfId/:boxId",
  verifyToken,
  updateBox
);

router.delete(
  "/store/:storeId/warehouse/:warehouseId/shelf/:shelfId/sub-shelf/:subShelfId/:boxId",
  verifyToken,
  deleteBox
);

module.exports = router;