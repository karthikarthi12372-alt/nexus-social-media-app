/**
 * Auth Controller
 * Handles registration, login, token refresh, and logout
 */

const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const logger = require("../utils/logger");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  const userObj = user.toPublicJSON ? user.toPublicJSON() : user.toObject();
  delete userObj.password;

  res.status(statusCode).json({
    success: true,
    token,
    user: userObj,
  });
};

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password, displayName } = req.body;

    // Check uniqueness
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.email === email ? "Email already in use." : "Username already taken.",
      });
    }

    const user = await User.create({ username, email, password, displayName: displayName || username });

    logger.info(`New user registered: ${user.username}`);
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Explicitly select password since it's excluded by default
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account has been deactivated." });
    }

    user.lastSeen = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ─── Get Current User ─────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("followers", "username displayName avatar isVerified")
      .populate("following", "username displayName avatar isVerified");

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ─── Logout (stateless - client discards token) ───────────────────────────────
exports.logout = (_req, res) => {
  res.json({ success: true, message: "Logged out successfully." });
};
