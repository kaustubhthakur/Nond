const express = require("express");

const router = express.Router();

const {
  createStore,
  getMyStores,
  getStore,
  updateStore,
  uploadStoreLogo,
  deleteStore,
  getBusinessOptions,
  getStoreStats,
} = require("../controllers/store");

const verifyToken = require("../middlewares/auth");
const { upload } = require("../middlewares/upload");


router.get("/options", verifyToken, getBusinessOptions);

router.post("/", verifyToken, createStore);


router.get("/", verifyToken, getMyStores);


router.get("/:storeId", verifyToken, getStore);


router.get("/:storeId/stats", verifyToken, getStoreStats);


router.put("/:storeId", verifyToken, updateStore);


router.put(
  "/:storeId/logo",
  verifyToken,
  (req, res, next) => {
    upload.single("logo")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          error: err.message || "Upload failed",
        });
      }

      next();
    });
  },
  uploadStoreLogo
);


router.delete("/:storeId", verifyToken, deleteStore);

module.exports = router;