const express = require("express");

const router = express.Router();

const verifyToken = require("../middlewares/auth");
const { upload, uploadToCloudinary } = require("../middlewares/upload");

const User = require("../models/User");

const {
  getUser,
  getAllUsers,
  updateUser,
  completeOnboarding,
} = require("../controllers/users");

// Get all users
router.get("/", verifyToken, getAllUsers);

// Get single user
router.get("/:id", verifyToken, getUser);

// Update user
router.patch("/:id", verifyToken, updateUser);

// Complete onboarding
router.patch("/:id/onboarding", verifyToken, completeOnboarding);

// Upload / replace user avatar
router.put(
  "/:id/avatar",
  verifyToken,
  (req, res, next) => {
    upload.single("avatar")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          error: err.message || "Upload failed",
        });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      const { id } = req.params;

      // Make sure the logged-in user can only update their own avatar
      if (String(req.user.id) !== String(id)) {
        return res.status(403).json({
          error: "You are not authorized to update this user's avatar",
        });
      }

      // Make sure a file was uploaded
      if (!req.file) {
        return res.status(400).json({
          error: "No avatar file was uploaded",
        });
      }

      // Upload image directly to Cloudinary
      const result = await uploadToCloudinary(
        req.file.buffer,
        "my-app/avatars"
      );

      const avatarUrl = result.secure_url;

      // Save Cloudinary URL in database
      const user = await User.updateUser(id, {
        avatar: avatarUrl,
      });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Avatar uploaded successfully",
        user,
      });
    } catch (err) {
      console.error("Upload avatar error:", err);

      return res.status(500).json({
        error: "Failed to upload avatar",
      });
    }
  }
);

module.exports = router;