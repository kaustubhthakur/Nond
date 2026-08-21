const express = require("express");

const router = express.Router();
const verifyToken = require("../middleware/auth");

const {
  getUser,
  getAllUsers,
  updateUser,
  updateOnlineStatus,
  completeOnboarding} = require("../controllers/users");
  
router.get("/",verifyToken, getAllUsers);
router.get("/:id",verifyToken, getUser);
router.put("/:id",verifyToken, updateUser);
router.put("/:id/online",verifyToken, updateOnlineStatus);
router.put("/:id/onboarding",verifyToken, completeOnboarding);

module.exports = router;