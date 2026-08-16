const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userModel = require("../models/userModel");
const storeModel = require("../models/storeModel");

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

exports.register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      phone,
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email and password are required",
      });
    }

    const existingEmail =
      await userModel.findUserByEmail(email);

    if (existingEmail) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    if (phone) {
      const existingPhone =
        await userModel.findUserByPhone(phone);

      if (existingPhone) {
        return res.status(409).json({
          error: "Phone number already registered",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const user = await userModel.createUser({
      username,
      email,
      password: hashedPassword,
      phone,
    });

    return res.status(201).json({
      message: "Account created successfully",
      user,
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      error: "Failed to create account",
    });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const {
      userId,
      method,
    } = req.body;

    if (!userId || !method) {
      return res.status(400).json({
        error: "User ID and OTP method are required",
      });
    }

    if (!["email", "phone"].includes(method)) {
      return res.status(400).json({
        error: "OTP method must be email or phone",
      });
    }

    const user = await userModel.findUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (
      method === "email" &&
      user.email_verified
    ) {
      return res.status(400).json({
        error: "Email is already verified",
      });
    }

    if (
      method === "phone" &&
      user.phone_verified
    ) {
      return res.status(400).json({
        error: "Phone is already verified",
      });
    }

    if (
      method === "phone" &&
      !user.phone
    ) {
      return res.status(400).json({
        error: "No phone number associated with this account",
      });
    }

    const canResend =
      await userModel.canResendOtp(
        userId,
        method
      );

    if (!canResend) {
      const retryAfter =
        await userModel.getResendTime(
          userId,
          method
        );

      return res.status(429).json({
        error: "Please wait before requesting another OTP",
        retryAfter,
      });
    }

    const otp = generateOtp();

    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    await userModel.saveOtp(
      userId,
      otp,
      expiresAt,
      method
    );

    /*
      Send OTP here.

      method === "email"
        -> send email

      method === "phone"
        -> send SMS
    */

    console.log(
      `OTP for ${method}: ${otp}`
    );

    return res.status(200).json({
      message: `OTP sent successfully to ${method}`,
      retryAfter: 90,
    });
  } catch (error) {
    console.error("Send OTP error:", error);

    return res.status(500).json({
      error: "Failed to send OTP",
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const {
      userId,
      otp,
      method,
    } = req.body;

    if (!userId || !otp || !method) {
      return res.status(400).json({
        error: "User ID, OTP and method are required",
      });
    }

    const user = await userModel.findUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const otpData =
      await userModel.getLatestOtp(
        userId,
        method
      );

    if (!otpData) {
      return res.status(400).json({
        error: "OTP not found",
      });
    }

    if (
      new Date(otpData.expires_at) < new Date()
    ) {
      return res.status(400).json({
        error: "OTP has expired",
      });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({
        error: "Invalid OTP",
      });
    }

    if (method === "email") {
      await userModel.verifyEmail(userId);
    } else {
      await userModel.verifyPhone(userId);
    }

    await userModel.deleteOtp(
      userId,
      method
    );

    const updatedUser =
      await userModel.findUserById(userId);

    const token = generateToken(updatedUser);

    return res.status(200).json({
      message: "OTP verified successfully",
      token,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        email_verified:
          updatedUser.email_verified,
        phone_verified:
          updatedUser.phone_verified,
        onboarding_completed:
          updatedUser.onboarding_completed,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    return res.status(500).json({
      error: "Failed to verify OTP",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const user =
      await userModel.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: "Please verify your email first",
        requiresVerification: true,
        userId: user.id,
      });
    }

    await userModel.updateOnlineStatus(
      user.id,
      true
    );

    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      onboarding_completed:
        user.onboarding_completed,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        onboarding_completed:
          user.onboarding_completed,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      error: "Login failed",
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user =
      await userModel.getUser(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      error: "Failed to get user",
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const user =
      await userModel.updateUser(
        userId,
        req.body
      );

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);

    return res.status(500).json({
      error: "Failed to update user",
    });
  }
};

exports.completeOnboarding = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const existingStore =
      await storeModel.getStoreByUserId(
        userId
      );

    if (existingStore) {
      return res.status(409).json({
        error: "Store setup is already completed",
        store: existingStore,
      });
    }

    const store =
      await storeModel.createStore({
        userId,
        ...req.body,
      });

    const user =
      await userModel.completeOnboarding(
        userId
      );

    return res.status(201).json({
      message: "Onboarding completed successfully",
      store,
      onboarding_completed:
        user.onboarding_completed,
    });
  } catch (error) {
    console.error(
      "Complete onboarding error:",
      error
    );

    return res.status(500).json({
      error: "Failed to complete onboarding",
    });
  }
};

exports.getMyStore = async (req, res) => {
  try {
    const userId = req.user.id;

    const store =
      await storeModel.getStoreByUserId(
        userId
      );

    if (!store) {
      return res.status(404).json({
        error: "Store not found",
      });
    }

    return res.status(200).json({
      store,
    });
  } catch (error) {
    console.error(
      "Get store error:",
      error
    );

    return res.status(500).json({
      error: "Failed to get store",
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;

    await userModel.updateOnlineStatus(
      userId,
      false
    );

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      error: "Logout failed",
    });
  }
};