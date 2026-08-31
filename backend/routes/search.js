const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/auth");

const {
  searchProducts,
} = require("../controllers/search");

router.get(
  "/store/:storeId/search",
  verifyToken,
  searchProducts
);

module.exports = router;