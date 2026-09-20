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

      
      if (String(req.user.id) !== String(id)) {
        return res.status(403).json({
          error: "You are not authorized to update this user's avatar",
        });
      }

     
      if (!req.file) {
        return res.status(400).json({
          error: "No avatar file was uploaded",
        });
      }

     
      const result = await uploadToCloudinary(
        req.file.buffer,
        "my-app/avatars"
      );

      const avatarUrl = result.secure_url;

      
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