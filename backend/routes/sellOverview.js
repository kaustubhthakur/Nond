const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth");

const { getSellOverview } = require("../controllers/sellOverview");

router.get("/store/:storeId", verifyToken, getSellOverview);

module.exports = router;