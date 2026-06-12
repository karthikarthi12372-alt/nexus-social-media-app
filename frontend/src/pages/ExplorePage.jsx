import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

export default function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/posts/explore?limit=24").then((r) => setPosts(r.data.posts)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Explore</h1>
      </div>

      {loading ? (
        <div className="media-grid">
          {[...Array(9)].map((_, i) => <div key={i} className="skeleton media-item" />)}
        </div>
      ) : posts.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Nothing to explore yet.</div>
      ) : (
        <div className="media-grid">
          {posts.map((post) => (
            <div key={post._id} className="media-item" onClick={() => navigate(`/post/${post._id}`)}>
              {post.images?.[0] ? (
                <img src={post.images[0].url} alt="" />
              ) : (
                <div className="text-tile">
                  <span>{post.text?.slice(0, 80)}</span>
                </div>
              )}
              <div className="media-overlay">
                <span>♥ {post.likeCount ?? post.likes?.length ?? 0}</span>
                <span>💬 {post.commentCount ?? post.comments?.length ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .page-container { min-height: 100vh; }
        .page-header { position: sticky; top: 0; z-index: 10; background: var(--bg-secondary); backdrop-filter: blur(12px); padding: 14px 16px; border-bottom: 1px solid var(--border); }
        .page-title { font-size: 18px; font-weight: 700; }
        .media-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px; }
        .media-item { aspect-ratio: 1; overflow: hidden; cursor: pointer; position: relative; background: var(--bg-tertiary); border-radius: var(--radius-sm); }
        .media-item img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--transition); }
        .media-item:hover img { transform: scale(1.05); }
        .text-tile { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 12px; background: linear-gradient(135deg, var(--accent-light), var(--bg-tertiary)); font-size: 13px; font-weight: 600; text-align: center; }
        .media-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); opacity: 0; display: flex; align-items: center; justify-content: center; gap: 16px; color: #fff; font-weight: 700; font-size: 14px; transition: opacity var(--transition); }
        .media-item:hover .media-overlay { opacity: 1; }
      `}</style>
    </div>
  );
}
