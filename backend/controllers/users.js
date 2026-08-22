const User = require("../models/User");

const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id !== id) {
      return res.status(403).json({
        error: "You are not authorized to access this user",
      });
    }

    const user = await User.getUser(id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("Get user error:", err);

    return res.status(500).json({
      error: "Failed to get user",
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.getAllUsers();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    console.error("Get all users error:", err);

    return res.status(500).json({
      error: "Failed to get users",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id !== id) {
      return res.status(403).json({
        error: "You are not authorized to update this user",
      });
    }

    const {
      username,
      avatar,
      phone,
    } = req.body;

    if (
      username !== undefined &&
      (!username || !username.trim())
    ) {
      return res.status(400).json({
        error: "Username cannot be empty",
      });
    }

    const user = await User.updateUser(id, {
      username:
        username !== undefined
          ? username.trim()
          : undefined,
      avatar,
      phone,
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    console.error("Update user error:", err);

    return res.status(500).json({
      error: "Failed to update profile",
    });
  }
};

const completeOnboarding = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id !== id) {
      return res.status(403).json({
        error: "You are not authorized to complete onboarding for this user",
      });
    }

    const user = await User.completeOnboarding(id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Onboarding completed successfully",
      user,
    });
  } catch (err) {
    console.error("Complete onboarding error:", err);

    return res.status(500).json({
      error: "Failed to complete onboarding",
    });
  }
};

module.exports = {
  getUser,
  getAllUsers,
  updateUser,
  completeOnboarding,
};