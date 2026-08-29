const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const {
  createStore,
  getMyStores,
  getStore,
  updateStore,
  uploadStoreLogo,
  deleteStore,
  getBusinessOptions,
  getStoreStats, // add this
} = require("../controllers/store");

const verifyToken = require("../middlewares/auth");

const uploadDir = path.join(__dirname, "..", "uploads", "store-logos");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.storeId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

router.get("/options", verifyToken, getBusinessOptions);

router.post("/", verifyToken, createStore);

router.get("/", verifyToken, getMyStores);

router.get("/:storeId", verifyToken, getStore);

router.get("/:storeId/stats", verifyToken, getStoreStats); // new

router.put("/:storeId", verifyToken, updateStore);

router.put("/:storeId/logo", verifyToken, (req, res, next) => {
  upload.single("logo")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Upload failed" });
    }
    next();
  });
}, uploadStoreLogo);

router.delete("/:storeId", verifyToken, deleteStore);

module.exports = router;