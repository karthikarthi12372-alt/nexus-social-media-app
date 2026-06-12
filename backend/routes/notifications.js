const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getNotifications, markAllRead, markOneRead, deleteNotification,
} = require("../controllers/notificationController");

const notifRouter = express.Router();
notifRouter.use(protect);
notifRouter.get("/", getNotifications);
notifRouter.put("/read-all", markAllRead);
notifRouter.put("/:id/read", markOneRead);
notifRouter.delete("/:id", deleteNotification);

module.exports = notifRouter;
