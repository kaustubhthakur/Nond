const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const verifyToken = require("../middlewares/auth");
const User = require("../models/User");

const {
  getUser,
  getAllUsers,
  updateUser,
  completeOnboarding,
} = require("../controllers/users");

const uploadDir = path.join(__dirname, "..", "uploads", "avatars");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

router.get("/", verifyToken, getAllUsers);
router.get("/:id", verifyToken, getUser);
router.patch("/:id", verifyToken, updateUser);
router.patch("/:id/onboarding", verifyToken, completeOnboarding);

router.put(
  "/:id/avatar",
  verifyToken,
  (req, res, next) => {
    upload.single("avatar")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "Upload failed" });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { id } = req.params;

      if  (String(req.user.id) !== String(id))  {
        return res.status(403).json({
          error: "You are not authorized to update this user's avatar",
        });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No avatar file was uploaded" });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      const user = await User.updateUser(id, { avatar: avatarUrl });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Avatar uploaded successfully",
        user,
      });
    } catch (err) {
      console.error("Upload avatar error:", err);
      return res.status(500).json({ error: "Failed to upload avatar" });
    }
  }
);

module.exports = router;