/**
 * Post Controller
 * CRUD, likes, comments, feed, repost
 */

const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { cloudinary } = require("../config/cloudinary");

// ─── Create Post ──────────────────────────────────────────────────────────────
exports.createPost = async (req, res, next) => {
  try {
    const { text, visibility } = req.body;

    if (!text && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ success: false, message: "Post must have text or an image." });
    }

    const images = (req.files || []).map((f) => ({
      url: f.path,
      publicId: f.filename,
    }));

    const post = await Post.create({
      author: req.user._id,
      text: text || "",
      images,
      visibility: visibility || "public",
    });

    await post.populate("author", "username displayName avatar isVerified");

    // Emit to followers via socket
    req.io?.emit("newPost", post);

    res.status(201).json({ success: true, post });
  } catch (err) {
    next(err);
  }
};

// ─── Get Feed (Following + Own Posts) ────────────────────────────────────────
exports.getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id).select("following");
    const feedUsers = [...currentUser.following, req.user._id];

    const posts = await Post.find({
      author: { $in: feedUsers },
      visibility: { $in: ["public", "followers"] },
    })
      .populate("author", "username displayName avatar isVerified")
      .populate("comments.user", "username displayName avatar")
      .populate("repostOf")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({
      author: { $in: feedUsers },
      visibility: { $in: ["public", "followers"] },
    });

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Post ──────────────────────────────────────────────────────────
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username displayName avatar isVerified bio")
      .populate("comments.user", "username displayName avatar isVerified")
      .populate("comments.replies.user", "username displayName avatar");

    if (!post) return res.status(404).json({ success: false, message: "Post not found." });

    // Increment views
    await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({ success: true, post });
  } catch (err) {
    next(err);
  }
};

// ─── Update Post ──────────────────────────────────────────────────────────────
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    const { text, visibility } = req.body;
    post.text = text !== undefined ? text : post.text;
    post.visibility = visibility || post.visibility;
    post.isEdited = true;
    post.editedAt = new Date();

    await post.save();
    await post.populate("author", "username displayName avatar isVerified");

    res.json({ success: true, post });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Post ──────────────────────────────────────────────────────────────
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    // Delete images from Cloudinary
    for (const img of post.images) {
      if (img.publicId) await cloudinary.uploader.destroy(img.publicId);
    }

    await post.deleteOne();
    res.json({ success: true, message: "Post deleted." });
  } catch (err) {
    next(err);
  }
};

// ─── Like / Unlike Post ───────────────────────────────────────────────────────
exports.toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });

    const userId = req.user._id;
    const isLiked = post.likes.includes(userId);

    const update = isLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } };
    await Post.findByIdAndUpdate(req.params.id, update);

    // Send notification only when liking (not unliking), and not own post
    if (!isLiked && post.author.toString() !== userId.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: userId,
        type: "like",
        post: post._id,
      });

      req.io?.to(post.author.toString()).emit("notification", {
        type: "like",
        sender: { _id: userId, username: req.user.username, avatar: req.user.avatar },
        postId: post._id,
        message: `${req.user.username} liked your post.`,
      });
    }

    res.json({ success: true, liked: !isLiked, likeCount: isLiked ? post.likes.length - 1 : post.likes.length + 1 });
  } catch (err) {
    next(err);
  }
};

// ─── Add Comment ──────────────────────────────────────────────────────────────
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: "Comment text is required." });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });

    const comment = { user: req.user._id, text: text.trim() };
    post.comments.push(comment);
    await post.save();

    const newComment = post.comments[post.comments.length - 1];
    await Post.populate(post, { path: "comments.user", select: "username displayName avatar" });

    // Notify post author
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: "comment",
        post: post._id,
        comment: text.trim(),
      });

      req.io?.to(post.author.toString()).emit("notification", {
        type: "comment",
        sender: { _id: req.user._id, username: req.user.username, avatar: req.user.avatar },
        postId: post._id,
        message: `${req.user.username} commented on your post.`,
      });
    }

    res.status(201).json({ success: true, comment: newComment });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Comment ───────────────────────────────────────────────────────────
exports.deleteComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found." });

    const isOwner = comment.user.toString() === req.user._id.toString();
    const isPostOwner = post.author.toString() === req.user._id.toString();

    if (!isOwner && !isPostOwner) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    comment.deleteOne();
    await post.save();

    res.json({ success: true, message: "Comment deleted." });
  } catch (err) {
    next(err);
  }
};

// ─── Explore / Trending Posts ─────────────────────────────────────────────────
exports.getExplorePosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ visibility: "public", repostOf: null })
      .populate("author", "username displayName avatar isVerified")
      .sort({ likes: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, posts });
  } catch (err) {
    next(err);
  }
};
