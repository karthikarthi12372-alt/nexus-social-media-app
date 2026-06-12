// ─── Post Routes ─────────────────────────────────────────────────────────────
const express = require("express");
const { protect } = require("../middleware/auth");
const { uploadPost } = require("../config/cloudinary");
const {
  createPost, getFeed, getPost, updatePost, deletePost,
  toggleLike, addComment, deleteComment, getExplorePosts,
} = require("../controllers/postController");

const postRouter = express.Router();
postRouter.use(protect);

postRouter.get("/feed", getFeed);
postRouter.get("/explore", getExplorePosts);
postRouter.post("/", uploadPost.array("images", 4), createPost);
postRouter.get("/:id", getPost);
postRouter.put("/:id", updatePost);
postRouter.delete("/:id", deletePost);
postRouter.post("/:id/like", toggleLike);
postRouter.post("/:id/comments", addComment);
postRouter.delete("/:id/comments/:commentId", deleteComment);

module.exports = postRouter;
