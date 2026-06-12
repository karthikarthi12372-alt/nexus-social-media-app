/**
 * Conversation & Message Schemas for real-time DMs
 */

const mongoose = require("mongoose");

// ─── Message ──────────────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, maxlength: 2000 },
    image: { url: String, publicId: String },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

// ─── Conversation ─────────────────────────────────────────────────────────────
const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    lastActivity: { type: Date, default: Date.now },
    isGroup: { type: Boolean, default: false },
    groupName: String,
    groupAvatar: String,
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, lastActivity: -1 });

const Message = mongoose.model("Message", messageSchema);
const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = { Message, Conversation };
