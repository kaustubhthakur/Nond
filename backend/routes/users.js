const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/auth");

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

module.exports = router;