const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      isAdmin: user.isadmin || false,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const sendEmail = async (email, otp, subject) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html: `
      <h2>${subject}</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP expires in 5 minutes.</p>
    `,
  });
};

const register = async (req, res) => {
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
      await User.findUserByEmail(email);

    if (existingEmail) {
      return res.status(400).json({
        error: "Email already exists",
      });
    }

    const existingUsername =
      await User.findUserByUsername(username);

    if (existingUsername) {
      return res.status(400).json({
        error: "Username already taken",
      });
    }

    if (phone) {
      const existingPhone =
        await User.findUserByPhone(phone);

      if (existingPhone) {
        return res.status(400).json({
          error: "Phone number already exists",
        });
      }
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await User.createUser({
      username,
      email,
      password: hashedPassword,
      phone,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message,
    });
  }
};

const login = async (req, res) => {
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
      await User.findUserByEmail(email);

    if (!user) {
      return res.status(400).json({
        error: "Invalid email or password",
      });
    }

    const valid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!valid) {
      return res.status(400).json({
        error: "Invalid email or password",
      });
    }

    const method = "email";

    const canResend =
      await User.canResendOtp(
        user.id,
        method
      );

    if (!canResend) {
      const retryAfter =
        await User.getResendTime(
          user.id,
          method
        );

      return res.status(429).json({
        error:
          "Please wait before requesting another OTP",
        retryAfter,
      });
    }

    const otp = generateOtp();

    const hashedOtp =
      await bcrypt.hash(otp, 10);

    const expiresAt =
      new Date(
        Date.now() + 5 * 60 * 1000
      );

    await User.deleteOtp(
      user.id,
      method
    );

    await User.saveOtp(
      user.id,
      hashedOtp,
      expiresAt,
      method
    );

    await sendEmail(
      user.email,
      otp,
      "Login OTP"
    );

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
      userId: user.id,
      method,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message,
    });
  }
};

const sendOtp = async (req, res) => {
  try {
    const {
      userId,
      method = "email",
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "userId is required",
      });
    }

    if (!["email", "phone"].includes(method)) {
      return res.status(400).json({
        error: "Invalid OTP method",
      });
    }

    const user =
      await User.findUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (method === "email" && !user.email) {
      return res.status(400).json({
        error: "User does not have an email",
      });
    }

    if (method === "phone" && !user.phone) {
      return res.status(400).json({
        error: "User does not have a phone number",
      });
    }

    const canResend =
      await User.canResendOtp(
        userId,
        method
      );

    if (!canResend) {
      const retryAfter =
        await User.getResendTime(
          userId,
          method
        );

      return res.status(429).json({
        error:
          "Please wait before requesting another OTP",
        retryAfter,
      });
    }

    const otp = generateOtp();

    const hashedOtp =
      await bcrypt.hash(otp, 10);

    const expiresAt =
      new Date(
        Date.now() + 5 * 60 * 1000
      );

    await User.deleteOtp(
      userId,
      method
    );

    await User.saveOtp(
      userId,
      hashedOtp,
      expiresAt,
      method
    );

    if (method === "email") {
      await sendEmail(
        user.email,
        otp,
        "Verification OTP"
      );
    } else {
      return res.status(501).json({
        error: "Phone OTP service not configured",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      userId,
      method,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message,
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const {
      userId,
      otp,
      method = "email",
    } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        error: "userId and otp are required",
      });
    }

    if (!["email", "phone"].includes(method)) {
      return res.status(400).json({
        error: "Invalid OTP method",
      });
    }

    const record =
      await User.getLatestOtp(
        userId,
        method
      );

    if (!record) {
      return res.status(400).json({
        error: "OTP not found",
      });
    }

    if (
      new Date() >
      new Date(record.expires_at)
    ) {
      await User.deleteOtp(
        userId,
        method
      );

      return res.status(400).json({
        error: "OTP expired",
      });
    }

    const validOtp =
      await bcrypt.compare(
        otp,
        record.otp
      );

    if (!validOtp) {
      return res.status(400).json({
        error: "Invalid OTP",
      });
    }

    const user =
      await User.findUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    await User.deleteOtp(
      userId,
      method
    );

    const token =
      generateToken(user);

    const {
      password,
      ...userData
    } = user;

    return res
      .cookie("access_token", token, {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge:
          7 *
          24 *
          60 *
          60 *
          1000,
      })
      .status(200)
      .json({
        success: true,
        message: "Logged in successfully",
        token,
        user: userData,
      });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message,
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "userId is required",
      });
    }

    const user =
      await User.verifyEmail(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message,
    });
  }
};

const verifyPhone = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "userId is required",
      });
    }

    const user =
      await User.verifyPhone(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Phone verified successfully",
      user,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message,
    });
  }
};

const logout = (req, res) => {
  return res
    .clearCookie("access_token", {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    .status(200)
    .json({
      success: true,
      message: "Logged out successfully",
    });
};

module.exports = {
  register,
  login,
  sendOtp,
  verifyOtp,
  verifyEmail,
  verifyPhone,
  logout,
};