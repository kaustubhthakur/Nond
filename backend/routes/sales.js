const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth");

const { createSale, getSales } = require("../controllers/sales");

router.post("/store/:storeId", verifyToken, createSale);
router.get("/store/:storeId", verifyToken, getSales);

module.exports = router;