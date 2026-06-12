import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../services/api.js";
import PostCard from "../components/post/PostCard.jsx";
import toast from "react-hot-toast";

const TABS = ["all", "users", "posts", "tags"];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [tab, setTab] = useState("all");
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("q")) handleSearch(searchParams.get("q"));
  }, []);

  const handleSearch = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearchParams({ q });
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(q)}&type=${tab}`);
      setResults(res.data.results);
    } catch {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId, idx) => {
    try {
      await api.post(`/users/${userId}/follow`);
      toast.success("Done!");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="search-bar">
          <span className="search-icon">⌕</span>
          <input
            className="input search-input"
            placeholder="Search Nexus..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            autoFocus
          />
        </div>

        {/* Tabs */}
        <div className="search-tabs">
          {TABS.map((t) => (
            <button key={t} className={`search-tab ${tab === t ? "active" : ""}`} onClick={() => { setTab(t); if (query) handleSearch(); }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Searching...</div>
      ) : Object.keys(results).length === 0 ? (
        <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⌕</div>
          Search for people, posts, or hashtags.
        </div>
      ) : (
        <div>
          {/* Users */}
          {results.users?.length > 0 && (tab === "all" || tab === "users") && (
            <div>
              <h3 className="section-title">People</h3>
              {results.users.map((u) => (
                <div key={u._id} className="user-row">
                  <Link to={`/${u.username}`} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                    <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.displayName}&background=7c3aed&color=fff`} className="avatar avatar-md" alt="" />
                    <div>
                      <div className="font-semibold text-sm">{u.displayName}</div>
                      <div className="text-xs text-muted">@{u.username}</div>
                      {u.bio && <div className="text-xs text-secondary truncate" style={{ maxWidth: 240 }}>{u.bio}</div>}
                    </div>
                  </Link>
                  <button className="btn btn-outline btn-sm" onClick={() => handleFollow(u._id)}>Follow</button>
                </div>
              ))}
            </div>
          )}

          {/* Posts */}
          {results.posts?.length > 0 && (tab === "all" || tab === "posts") && (
            <div>
              <h3 className="section-title">Posts</h3>
              {results.posts.map((post) => <PostCard key={post._id} post={post} />)}
            </div>
          )}

          {/* Hashtags */}
          {results.hashtags?.length > 0 && (tab === "all" || tab === "tags") && (
            <div>
              <h3 className="section-title">Hashtags</h3>
              {results.hashtags.map((tag) => (
                <Link key={tag._id} to={`/search?q=%23${tag._id}`} className="user-row">
                  <div className="hashtag-icon">#</div>
                  <div>
                    <div className="font-semibold text-sm">#{tag._id}</div>
                    <div className="text-xs text-muted">{tag.count} posts</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!results.users?.length && !results.posts?.length && !results.hashtags?.length && (
            <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
              No results for "{searchParams.get("q")}"
            </div>
          )}
        </div>
      )}

      <style>{`
        .page-container { min-height: 100vh; }
        .page-header { position: sticky; top: 0; z-index: 10; background: var(--bg-secondary); backdrop-filter: blur(12px); padding: 12px 16px; border-bottom: 1px solid var(--border); }
        .search-bar { position: relative; margin-bottom: 10px; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        .search-input { padding-left: 36px; border-radius: var(--radius-full); }
        .search-tabs { display: flex; gap: 4px; }
        .search-tab { padding: 6px 14px; border-radius: var(--radius-full); font-size: 13px; font-weight: 600; color: var(--text-muted); background: none; border: none; cursor: pointer; transition: all var(--transition); }
        .search-tab:hover { background: var(--bg-hover); }
        .search-tab.active { background: var(--accent); color: #fff; }
        .section-title { font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; padding: 14px 16px 8px; }
        .user-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); transition: background var(--transition); }
        .user-row:hover { background: var(--bg-hover); }
        .hashtag-icon { width: 44px; height: 44px; border-radius: 50%; background: var(--accent-light); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; }
      `}</style>
    </div>
  );
}
