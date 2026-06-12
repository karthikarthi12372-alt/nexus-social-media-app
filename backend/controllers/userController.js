/**
 * User Controller
 * Profile management, follow/unfollow, suggestions
 */

const User = require("../models/User");
const Post = require("../models/Post");
const Notification = require("../models/Notification");

// ─── Get User Profile ─────────────────────────────────────────────────────────
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate("followers", "username displayName avatar isVerified")
      .populate("following", "username displayName avatar isVerified")
      .select("-password");

    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Get post count
    const postCount = await Post.countDocuments({ author: user._id });

    res.json({ success: true, user: { ...user.toObject(), postCount } });
  } catch (err) {
    next(err);
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ["displayName", "bio", "website", "location", "isPrivate"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Handle avatar upload (set by multer/cloudinary middleware)
    if (req.file) {
      updates.avatar = req.file.path;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ─── Follow / Unfollow ────────────────────────────────────────────────────────
exports.toggleFollow = async (req, res, next) => {
  try {
    const targetId = req.params.userId;

    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot follow yourself." });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ success: false, message: "User not found." });

    const currentUser = await User.findById(req.user._id);
    const isFollowing = currentUser.following.includes(targetId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $pull: { followers: req.user._id } });

      return res.json({ success: true, following: false, message: "Unfollowed." });
    } else {
      // Follow
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $addToSet: { followers: req.user._id } });

      // Send notification
      await Notification.create({
        recipient: targetId,
        sender: req.user._id,
        type: "follow",
      });

      // Emit real-time notification
      req.io?.to(targetId).emit("notification", {
        type: "follow",
        sender: { _id: req.user._id, username: req.user.username, avatar: req.user.avatar },
        message: `${req.user.username} started following you.`,
      });

      return res.json({ success: true, following: true, message: "Followed." });
    }
  } catch (err) {
    next(err);
  }
};

// ─── Suggested Users (not already following) ─────────────────────────────────
exports.getSuggestedUsers = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id).select("following");
    const excludeIds = [...currentUser.following, req.user._id];

    const suggested = await User.find({ _id: { $nin: excludeIds }, isActive: true })
      .select("username displayName avatar bio isVerified followers")
      .limit(8)
      .sort({ followers: -1 });

    res.json({ success: true, users: suggested });
  } catch (err) {
    next(err);
  }
};

// ─── Get User Posts ───────────────────────────────────────────────────────────
exports.getUserPosts = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: user._id, repostOf: null })
      .populate("author", "username displayName avatar isVerified")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ author: user._id, repostOf: null });

    res.json({
      success: true,
      posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Save / Unsave Post ───────────────────────────────────────────────────────
exports.toggleSavePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const user = await User.findById(req.user._id);
    const isSaved = user.savedPosts.includes(postId);

    const update = isSaved
      ? { $pull: { savedPosts: postId } }
      : { $addToSet: { savedPosts: postId } };

    await User.findByIdAndUpdate(req.user._id, update);

    res.json({ success: true, saved: !isSaved });
  } catch (err) {
    next(err);
  }
};

// ─── Get Saved Posts ──────────────────────────────────────────────────────────
exports.getSavedPosts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "savedPosts",
      populate: { path: "author", select: "username displayName avatar isVerified" },
      options: { sort: { createdAt: -1 } },
    });

    res.json({ success: true, posts: user.savedPosts });
  } catch (err) {
    next(err);
  }
};
