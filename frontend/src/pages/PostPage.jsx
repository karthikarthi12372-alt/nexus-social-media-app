import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { formatDistanceToNow } from "date-fns";
import api from "../services/api.js";
import toast from "react-hot-toast";

export default function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/posts/${id}`);
      setPost(res.data.post);
      setLiked(res.data.post.likes?.includes(user?._id));
      setLikeCount(res.data.post.likes?.length ?? 0);
    } catch {
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => liked ? prev - 1 : prev + 1);
    await api.post(`/posts/${id}/like`).catch(() => {});
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${id}/comments`, { text: comment.trim() });
      setPost((prev) => ({ ...prev, comments: [...(prev.comments || []), res.data.comment] }));
      setComment("");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/posts/${id}/comments/${commentId}`);
      setPost((prev) => ({ ...prev, comments: prev.comments.filter((c) => c._id !== commentId) }));
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  if (loading) return (
    <div style={{ padding: 24 }}>
      <div className="skeleton" style={{ height: 20, width: "50%", marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 200, borderRadius: "var(--radius-md)" }} />
    </div>
  );

  if (!post) return null;

  const author = post.author;

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="icon-btn" onClick={() => navigate(-1)}>←</button>
        <h1 className="page-title">Post</h1>
      </div>

      <article style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
        {/* Author */}
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <Link to={`/${author?.username}`}>
            <img
              src={author?.avatar || `https://ui-avatars.com/api/?name=${author?.displayName}&background=7c3aed&color=fff`}
              className="avatar avatar-md"
              alt=""
            />
          </Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Link to={`/${author?.username}`} style={{ fontWeight: 700, fontSize: 15 }}>{author?.displayName}</Link>
              {author?.isVerified && <span className="verified-icon">✓</span>}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>@{author?.username}</div>
          </div>
        </div>

        {/* Content */}
        {post.text && (
          <p style={{ fontSize: 17, lineHeight: 1.65, marginBottom: 16, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {post.text}
          </p>
        )}

        {/* Images */}
        {post.images?.length > 0 && (
          <div style={{ marginBottom: 16, borderRadius: "var(--radius-md)", overflow: "hidden" }}>
            {post.images.map((img, i) => (
              <img key={i} src={img.url} alt="" style={{ width: "100%", marginBottom: i < post.images.length - 1 ? 2 : 0 }} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 12 }}>
          {new Date(post.createdAt).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          {post.isEdited && " · Edited"}
        </div>

        {/* Stats Bar */}
        {(likeCount > 0 || post.comments?.length > 0) && (
          <div style={{ display: "flex", gap: 20, fontSize: 14, padding: "12px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", marginBottom: 12, color: "var(--text-secondary)" }}>
            {likeCount > 0 && <span><strong style={{ color: "var(--text-primary)" }}>{likeCount}</strong> Likes</span>}
            {post.comments?.length > 0 && <span><strong style={{ color: "var(--text-primary)" }}>{post.comments.length}</strong> Comments</span>}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={handleLike}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: "var(--radius-full)", fontSize: 14, color: liked ? "#e11d48" : "var(--text-muted)", background: liked ? "#fee2e2" : "none", border: "none", cursor: "pointer", transition: "all 150ms" }}
          >
            <span style={{ fontSize: 18 }}>{liked ? "♥" : "♡"}</span> Like
          </button>
          <button
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: "var(--radius-full)", fontSize: 14, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
            onClick={() => document.getElementById("comment-input")?.focus()}
          >
            <span style={{ fontSize: 18 }}>💬</span> Comment
          </button>
        </div>
      </article>

      {/* Comment Input */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <img
          src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.displayName}&background=7c3aed&color=fff`}
          className="avatar avatar-sm"
          alt=""
        />
        <form onSubmit={handleComment} style={{ flex: 1, display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            id="comment-input"
            className="input"
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={1}
            maxLength={500}
            style={{ resize: "none", flex: 1 }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(e); } }}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={!comment.trim() || submitting}>
            {submitting ? "..." : "Reply"}
          </button>
        </form>
      </div>

      {/* Comments */}
      <div>
        {(post.comments || []).map((c) => (
          <div key={c._id} style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, animation: "fadeIn 0.2s ease" }}>
            <Link to={`/${c.user?.username}`}>
              <img
                src={c.user?.avatar || `https://ui-avatars.com/api/?name=${c.user?.displayName}&background=7c3aed&color=fff`}
                className="avatar avatar-sm"
                alt=""
              />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <Link to={`/${c.user?.username}`} style={{ fontWeight: 600, fontSize: 13 }}>{c.user?.displayName}</Link>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text-primary)" }}>{c.text}</p>
            </div>
            {(c.user?._id === user?._id || post.author?._id === user?._id) && (
              <button
                onClick={() => handleDeleteComment(c._id)}
                style={{ fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "var(--radius-sm)" }}
              >
                Delete
              </button>
            )}
          </div>
        ))}

        {post.comments?.length === 0 && (
          <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            No comments yet. Be the first!
          </div>
        )}
      </div>

      <style>{`
        .page-container { min-height: 100vh; }
        .page-header { position: sticky; top: 0; z-index: 10; background: var(--bg-secondary); backdrop-filter: blur(12px); padding: 12px 16px; border-bottom: 1px solid var(--border); }
        .page-title { font-size: 18px; font-weight: 700; }
        .icon-btn { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--text-secondary); background: none; border: none; cursor: pointer; transition: background var(--transition); }
        .icon-btn:hover { background: var(--bg-hover); }
      `}</style>
    </div>
  );
}
