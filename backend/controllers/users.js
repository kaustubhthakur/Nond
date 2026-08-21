const User = require("../models/User");

const getUser = async (req, res) => {
  try {
    const { id } = req.params;

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
    console.error(err);

    return res.status(500).json({
      error: err.message,
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
    console.error(err);

    return res.status(500).json({
      error: err.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      username,
      avatar,
      phone,
    } = req.body;

    const user = await User.updateUser(id, {
      username,
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
      message: "User updated successfully",
      user,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message,
    });
  }
};

const updateOnlineStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOnline } = req.body;

    if (typeof isOnline !== "boolean") {
      return res.status(400).json({
        error: "isOnline must be a boolean",
      });
    }

    const user =
      await User.updateOnlineStatus(
        id,
        isOnline
      );

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
    console.error(err);

    return res.status(500).json({
      error: err.message,
    });
  }
};

const completeOnboarding = async (req, res) => {
  try {
    const { id } = req.params;

    const user =
      await User.completeOnboarding(id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Onboarding completed successfully",
      user,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message,
    });
  }
};

module.exports = {
  getUser,
  getAllUsers,
  updateUser,
  updateOnlineStatus,
  completeOnboarding,
};