const express = require("express");
const { protect } = require("../middleware/auth");
const { uploadAvatar } = require("../config/cloudinary");
const {
  getUserProfile,
  updateProfile,
  toggleFollow,
  getSuggestedUsers,
  getUserPosts,
  toggleSavePost,
  getSavedPosts,
} = require("../controllers/userController");

const router = express.Router();

router.use(protect);

router.get("/suggestions", getSuggestedUsers);
router.get("/saved", getSavedPosts);
router.get("/:username", getUserProfile);
router.get("/:username/posts", getUserPosts);
router.put("/profile", uploadAvatar.single("avatar"), updateProfile);
router.post("/:userId/follow", toggleFollow);
router.post("/:postId/save", toggleSavePost);

module.exports = router;
