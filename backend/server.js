/**
 * Nexus Social Media - Server Entry Point
 * Initializes Express, Socket.IO, MongoDB, and all middleware
 */

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const { initSocket } = require("./socket/socketHandler");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const chatRoutes = require("./routes/chat");
const notificationRoutes = require("./routes/notifications");
const searchRoutes = require("./routes/search");
const uploadRoutes = require("./routes/upload");

dotenv.config();
console.log(process.env.MONGO_URI);
const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);

// Make io accessible in routes via req.io
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());

// Rate limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/upload", uploadRoutes);

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});

module.exports = { app, server };
