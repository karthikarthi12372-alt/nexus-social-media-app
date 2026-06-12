const express = require("express");
const { protect } = require("../middleware/auth");
const { uploadPost, uploadAvatar } = require("../config/cloudinary");

const router = express.Router();
router.use(protect);

// Single image upload for profile cover etc
router.post("/image", uploadPost.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });
  res.json({ success: true, url: req.file.path, publicId: req.file.filename });
});

router.post("/avatar", uploadAvatar.single("avatar"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });
  res.json({ success: true, url: req.file.path, publicId: req.file.filename });
});

module.exports = router;
