/**
 * Search Controller - Users and Posts
 */

const User = require("../models/User");
const Post = require("../models/Post");

exports.search = async (req, res, next) => {
  try {
    const { q, type = "all" } = req.query;

    if (!q?.trim()) {
      return res.status(400).json({ success: false, message: "Search query is required." });
    }

    const query = q.trim();
    const results = {};

    if (type === "all" || type === "users") {
      results.users = await User.find({
        $or: [
          { username: { $regex: query, $options: "i" } },
          { displayName: { $regex: query, $options: "i" } },
        ],
        isActive: true,
      })
        .select("username displayName avatar bio isVerified followers")
        .limit(10);
    }

    if (type === "all" || type === "posts") {
      results.posts = await Post.find({
        $or: [
          { text: { $regex: query, $options: "i" } },
          { hashtags: { $in: [query.replace("#", "").toLowerCase()] } },
        ],
        visibility: "public",
      })
        .populate("author", "username displayName avatar isVerified")
        .sort({ createdAt: -1 })
        .limit(10);
    }

    if (type === "all" || type === "tags") {
      // Trending hashtags
      const tagQuery = query.replace("#", "").toLowerCase();
      results.hashtags = await Post.aggregate([
        { $unwind: "$hashtags" },
        { $match: { hashtags: { $regex: tagQuery, $options: "i" } } },
        { $group: { _id: "$hashtags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);
    }

    res.json({ success: true, query, results });
  } catch (err) {
    next(err);
  }
};

exports.getTrending = async (req, res, next) => {
  try {
    const trending = await Post.aggregate([
      { $match: { visibility: "public", createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $unwind: "$hashtags" },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({ success: true, trending });
  } catch (err) {
    next(err);
  }
};
