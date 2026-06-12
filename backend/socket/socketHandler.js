/**
 * Socket.IO Handler
 * Real-time: notifications, chat, online status, typing indicators
 */

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");

// Track online users: userId -> socketId
const onlineUsers = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // ─── Auth Middleware ─────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  // ─── Connection ──────────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    logger.info(`Socket connected: ${socket.user.username} (${socket.id})`);

    // Join personal room for targeted notifications
    socket.join(userId);

    // Track online status
    onlineUsers.set(userId, socket.id);
    io.emit("userOnline", userId);

    // ─── Typing Indicators ─────────────────────────────────────────────
    socket.on("typing", ({ conversationId, recipientId }) => {
      socket.to(recipientId).emit("typing", { conversationId, userId });
    });

    socket.on("stopTyping", ({ conversationId, recipientId }) => {
      socket.to(recipientId).emit("stopTyping", { conversationId, userId });
    });

    // ─── Join Conversation Room ────────────────────────────────────────
    socket.on("joinConversation", (conversationId) => {
      socket.join(`conv_${conversationId}`);
    });

    socket.on("leaveConversation", (conversationId) => {
      socket.leave(`conv_${conversationId}`);
    });

    // ─── Disconnect ────────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      logger.info(`Socket disconnected: ${socket.user.username}`);
      onlineUsers.delete(userId);
      io.emit("userOffline", userId);

      // Update lastSeen
      await User.findByIdAndUpdate(userId, { lastSeen: Date.now() });
    });
  });

  return io;
};

const getOnlineUsers = () => onlineUsers;

module.exports = { initSocket, getOnlineUsers };
