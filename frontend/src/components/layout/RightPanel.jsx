import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api.js";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

export default function RightPanel() {
  const [suggested, setSuggested] = useState([]);
  const [trending, setTrending] = useState([]);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    api.get("/users/suggestions").then((r) => setSuggested(r.data.users || [])).catch(() => {});
    api.get("/search/trending").then((r) => setTrending(r.data.trending || [])).catch(() => {});
  }, []);

  const handleFollow = async (userId) => {
    try {
      await api.post(`/users/${userId}/follow`);
      setSuggested((prev) => prev.filter((u) => u._id !== userId));
      toast.success("Followed!");
    } catch {
      toast.error("Failed to follow");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Search Bar */}
      <Link to="/search">
        <div style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: "var(--radius-full)", padding: "10px 16px", color: "var(--text-muted)", fontSize: 14, cursor: "text" }}>
          ⌕ Search Nexus...
        </div>
      </Link>

      {/* Trending Tags */}
      {trending.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Trending</h3>
          {trending.map((tag, i) => (
            <Link key={tag._id} to={`/search?q=%23${tag._id}`} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < trending.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Trending</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>#{tag._id}</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{tag.count} posts</div>
            </Link>
          ))}
        </div>
      )}

      {/* Suggested Users */}
      {suggested.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Who to follow</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {suggested.slice(0, 5).map((u) => (
              <div key={u._id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Link to={`/${u.username}`}>
                  <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.displayName}&background=7c3aed&color=fff`} className="avatar avatar-sm" alt="" />
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/${u.username}`}>
                    <div style={{ fontWeight: 600, fontSize: 13 }} className="truncate">{u.displayName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>@{u.username}</div>
                  </Link>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => handleFollow(u._id)}>Follow</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "0 4px" }}>
        © 2025 Nexus · <Link to="/settings" style={{ color: "var(--text-muted)" }}>Settings</Link>
      </div>
    </div>
  );
}
