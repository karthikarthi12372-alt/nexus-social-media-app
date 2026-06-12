const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
} = require("../controllers/chatController");

const router = express.Router();
router.use(protect);

router.get("/conversations", getConversations);
router.get("/conversations/:userId/start", getOrCreateConversation);
router.get("/:conversationId/messages", getMessages);
router.post("/:conversationId/messages", sendMessage);
router.delete("/messages/:messageId", deleteMessage);

module.exports = router;
