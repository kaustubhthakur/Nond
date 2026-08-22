const express = require("express");

const router = express.Router();

const {
  createStore,
  getMyStores,
  getStore,
  updateStore,
  deleteStore,
  getBusinessOptions,
} = require("../controllers/store");

const verifyToken = require("../middlewares/auth");

router.get("/options", verifyToken, getBusinessOptions);

router.post("/", verifyToken, createStore);

router.get("/", verifyToken, getMyStores);

router.get("/:storeId", verifyToken, getStore);

router.put("/:storeId", verifyToken, updateStore);

router.delete("/:storeId", verifyToken, deleteStore);

module.exports = router;