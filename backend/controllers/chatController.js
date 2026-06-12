/**
 * Chat Controller
 * Conversations and direct messages
 */

const { Conversation, Message } = require("../models/Message");

// ─── Get or Create Conversation ───────────────────────────────────────────────
exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [myId, userId], $size: 2 },
      isGroup: false,
    }).populate("participants", "username displayName avatar isVerified lastSeen")
      .populate({ path: "lastMessage", populate: { path: "sender", select: "username avatar" } });

    if (!conversation) {
      conversation = await Conversation.create({ participants: [myId, userId] });
      conversation = await conversation.populate("participants", "username displayName avatar isVerified lastSeen");
    }

    res.json({ success: true, conversation });
  } catch (err) {
    next(err);
  }
};

// ─── Get All Conversations ────────────────────────────────────────────────────
exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate("participants", "username displayName avatar isVerified lastSeen")
      .populate({ path: "lastMessage", populate: { path: "sender", select: "username avatar" } })
      .sort({ lastActivity: -1 });

    res.json({ success: true, conversations });
  } catch (err) {
    next(err);
  }
};

// ─── Get Messages ─────────────────────────────────────────────────────────────
exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    // Verify participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const messages = await Message.find({ conversation: conversationId, isDeleted: false })
      .populate("sender", "username displayName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mark messages as read
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    next(err);
  }
};

// ─── Send Message ─────────────────────────────────────────────────────────────
exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!text?.trim() && !req.file) {
      return res.status(400).json({ success: false, message: "Message cannot be empty." });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const messageData = {
      conversation: conversationId,
      sender: req.user._id,
      text: text?.trim() || "",
      readBy: [req.user._id],
    };

    if (req.file) {
      messageData.image = { url: req.file.path, publicId: req.file.filename };
    }

    const message = await Message.create(messageData);
    await message.populate("sender", "username displayName avatar");

    // Update conversation last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastActivity: Date.now(),
    });

    // Emit to all participants
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== req.user._id.toString()) {
        req.io?.to(participantId.toString()).emit("newMessage", {
          message,
          conversationId,
        });
      }
    });

    res.status(201).json({ success: true, message });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Message ───────────────────────────────────────────────────────────
exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      sender: req.user._id,
    });

    if (!message) return res.status(404).json({ success: false, message: "Message not found." });

    message.isDeleted = true;
    message.text = "This message was deleted.";
    await message.save();

    res.json({ success: true, message: "Message deleted." });
  } catch (err) {
    next(err);
  }
};
