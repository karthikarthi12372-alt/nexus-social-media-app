import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { formatDistanceToNow } from "date-fns";
import { toggleLike, deletePost } from "../../store/postSlice.js";
import toast from "react-hot-toast";
import api from "../../services/api.js";

export default function PostCard({ post, onDeleted }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [localLiked, setLocalLiked] = useState(post.likes?.includes(user?._id));
  const [localLikeCount, setLocalLikeCount] = useState(post.likeCount ?? post.likes?.length ?? 0);
  const [showOptions, setShowOptions] = useState(false);
  const [saved, setSaved] = useState(false);

  const isOwner = user?._id === (post.author?._id || post.author);

  const handleLike = async (e) => {
    e.stopPropagation();
    setLocalLiked((prev) => !prev);
    setLocalLikeCount((prev) => (localLiked ? prev - 1 : prev + 1));
    dispatch(toggleLike(post._id));
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await dispatch(deletePost(post._id)).unwrap();
      toast.success("Post deleted");
      onDeleted?.(post._id);
    } catch {
      toast.error("Failed to delete");
    }
    setShowOptions(false);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    try {
      await api.post(`/users/${post._id}/save`);
      setSaved((prev) => !prev);
      toast.success(saved ? "Removed from saved" : "Post saved!");
    } catch {
      toast.error("Action failed");
    }
  };

  const author = post.author;
  const avatarUrl = author?.avatar || `https://ui-avatars.com/api/?name=${author?.displayName || "U"}&background=7c3aed&color=fff`;

  return (
    <article className="post-card" onClick={() => navigate(`/post/${post._id}`)}>
      {/* Author Row */}
      <div className="post-header">
        <Link to={`/${author?.username}`} onClick={(e) => e.stopPropagation()} className="author-link">
          <img src={avatarUrl} alt={author?.displayName} className="avatar avatar-md" />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span className="font-semibold text-sm">{author?.displayName}</span>
              {author?.isVerified && <span className="verified-icon" title="Verified">✓</span>}
            </div>
            <span className="text-xs text-muted">@{author?.username} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
          </div>
        </Link>

        {/* Options */}
        <div className="post-options-wrap" onClick={(e) => e.stopPropagation()}>
          <button className="icon-btn" onClick={() => setShowOptions(!showOptions)}>⋯</button>
          {showOptions && (
            <div className="dropdown">
              {isOwner ? (
                <>
                  <button onClick={() => navigate(`/post/${post._id}?edit=1`)}>Edit post</button>
                  <button className="danger" onClick={handleDelete}>Delete post</button>
                </>
              ) : (
                <button onClick={handleSave}>{saved ? "Unsave" : "Save post"}</button>
              )}
              <button onClick={() => { navigator.clipboard.writeText(window.location.origin + `/post/${post._id}`); toast.success("Link copied!"); setShowOptions(false); }}>Copy link</button>
            </div>
          )}
        </div>
      </div>

      {/* Post Text */}
      {post.text && (
        <p className="post-text" onClick={(e) => e.stopPropagation()}>
          {post.text.split(/(\s+)/).map((word, i) =>
            word.startsWith("#") ? (
              <Link key={i} to={`/search?q=${word}`} onClick={(e) => e.stopPropagation()} style={{ color: "var(--accent)", fontWeight: 500 }}>{word}</Link>
            ) : word.startsWith("@") ? (
              <Link key={i} to={`/${word.slice(1)}`} onClick={(e) => e.stopPropagation()} style={{ color: "var(--accent)", fontWeight: 500 }}>{word}</Link>
            ) : (
              <span key={i}>{word}</span>
            )
          )}
        </p>
      )}

      {/* Images */}
      {post.images?.length > 0 && (
        <div className={`post-images grid-${Math.min(post.images.length, 4)}`}>
          {post.images.slice(0, 4).map((img, i) => (
            <img key={i} src={img.url} alt="" className="post-image" />
          ))}
        </div>
      )}

      {/* Edited indicator */}
      {post.isEdited && <span className="text-xs text-muted" style={{ marginTop: 4, display: "block" }}>Edited</span>}

      {/* Actions */}
      <div className="post-actions" onClick={(e) => e.stopPropagation()}>
        <button className={`action-btn ${localLiked ? "liked" : ""}`} onClick={handleLike}>
          <span className="action-icon">{localLiked ? "♥" : "♡"}</span>
          <span>{localLikeCount > 0 ? localLikeCount : ""}</span>
        </button>
        <button className="action-btn" onClick={() => navigate(`/post/${post._id}`)}>
          <span className="action-icon">💬</span>
          <span>{post.commentCount ?? post.comments?.length ?? ""}</span>
        </button>
        <button className="action-btn">
          <span className="action-icon">↺</span>
          <span>{post.repostCount ?? 0}</span>
        </button>
        <button className="action-btn" onClick={handleSave}>
          <span className="action-icon">{saved ? "🔖" : "🔗"}</span>
        </button>
      </div>

      <style>{`
        .post-card {
          padding: 16px;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background var(--transition);
          animation: fadeIn 0.2s ease;
        }
        .post-card:hover { background: var(--bg-hover); }
        .post-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
        .author-link { display: flex; align-items: center; gap: 10px; }
        .post-text { font-size: 15px; line-height: 1.6; margin-bottom: 12px; white-space: pre-wrap; word-break: break-word; }
        .post-images { display: grid; gap: 4px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 12px; }
        .post-image { width: 100%; height: 280px; object-fit: cover; }
        .grid-1 { grid-template-columns: 1fr; }
        .grid-1 .post-image { height: 380px; }
        .grid-2 { grid-template-columns: 1fr 1fr; }
        .grid-3 { grid-template-columns: 1fr 1fr; }
        .grid-3 .post-image:first-child { grid-row: span 2; height: 100%; }
        .grid-4 { grid-template-columns: 1fr 1fr; }
        .grid-4 .post-image { height: 180px; }
        .post-actions { display: flex; gap: 4px; margin-top: 8px; }
        .action-btn { display: flex; align-items: center; gap: 5px; padding: 7px 12px; border-radius: var(--radius-full); font-size: 14px; color: var(--text-muted); transition: all var(--transition); background: none; border: none; cursor: pointer; }
        .action-btn:hover { background: var(--accent-light); color: var(--accent); }
        .action-btn.liked { color: #e11d48; }
        .action-btn.liked:hover { background: #fee2e2; }
        .action-icon { font-size: 16px; }
        .post-options-wrap { position: relative; }
        .icon-btn { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--text-muted); transition: background var(--transition); background: none; border: none; cursor: pointer; }
        .icon-btn:hover { background: var(--bg-hover); }
        .dropdown { position: absolute; right: 0; top: 36px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); min-width: 160px; z-index: 100; overflow: hidden; }
        .dropdown button { display: block; width: 100%; text-align: left; padding: 10px 16px; font-size: 14px; color: var(--text-primary); transition: background var(--transition); background: none; border: none; cursor: pointer; }
        .dropdown button:hover { background: var(--bg-hover); }
        .dropdown button.danger { color: var(--danger); }
      `}</style>
    </article>
  );
}
