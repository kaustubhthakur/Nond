const express = require("express");

const router = express.Router();

const {
  register,
  login,
  verifyOtp,
  logout,
  sendOtp,
  verifyEmail,
  verifyPhone,
} = require("../controllers/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/sendOtp", sendOtp);
router.post("/verifyOtp", verifyOtp);
router.post("/verifyEmail", verifyEmail);
router.post("/verifyPhone", verifyPhone);
router.post("/logout", logout);

module.exports = router;