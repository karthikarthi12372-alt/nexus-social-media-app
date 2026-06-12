/**
 * Post Schema
 * Handles posts, likes, comments, reposts
 */

const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    replies: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, trim: true, maxlength: 300 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: [500, "Post text cannot exceed 500 characters"],
    },
    images: [
      {
        url: String,
        publicId: String, // Cloudinary public_id for deletion
      },
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    repostOf: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    hashtags: [{ type: String, trim: true, lowercase: true }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    visibility: {
      type: String,
      enum: ["public", "followers", "private"],
      default: "public",
    },
    isEdited: { type: Boolean, default: false },
    editedAt: Date,
    views: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
postSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

postSchema.virtual("commentCount").get(function () {
  return this.comments.length;
});

postSchema.virtual("repostCount").get(function () {
  return this.reposts.length;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ text: "text" });

// ─── Pre-save: Extract Hashtags & Mentions ────────────────────────────────────
postSchema.pre("save", function (next) {
  if (this.isModified("text") && this.text) {
    // Extract hashtags like #hello
    const tags = this.text.match(/#[a-zA-Z0-9_]+/g) || [];
    this.hashtags = [...new Set(tags.map((t) => t.slice(1).toLowerCase()))];
  }
  next();
});

module.exports = mongoose.model("Post", postSchema);
