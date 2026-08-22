const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/auth");

const {
  createWarehouse,
  getWarehouses,
  getWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getWarehouseOptions,
} = require("../controllers/warehouses");

router.get(
  "/options",
  verifyToken,
  getWarehouseOptions
);

router.post(
  "/",
  verifyToken,
  createWarehouse
);

router.get(
  "/store/:storeId",
  verifyToken,
  getWarehouses
);

router.get(
  "/store/:storeId/:warehouseId",
  verifyToken,
  getWarehouse
);

router.put(
  "/store/:storeId/:warehouseId",
  verifyToken,
  updateWarehouse
);

router.delete(
  "/store/:storeId/:warehouseId",
  verifyToken,
  deleteWarehouse
);

module.exports = router;