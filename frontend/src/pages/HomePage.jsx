import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import InfiniteScroll from "react-infinite-scroll-component";
import { fetchFeed } from "../store/postSlice.js";
import { openModal } from "../store/uiSlice.js";
import PostCard from "../components/post/PostCard.jsx";

function PostSkeleton() {
  return (
    <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: "50%" }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 14, width: "40%", marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 12, width: "25%" }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 14, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 14, width: "80%", marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 200, borderRadius: "var(--radius-md)" }} />
    </div>
  );
}

export default function HomePage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { feed, loading, pagination } = useSelector((s) => s.posts);

  useEffect(() => {
    dispatch(fetchFeed(1));
  }, []);

  const loadMore = () => {
    if (pagination.hasMore) dispatch(fetchFeed(pagination.page + 1));
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Home</h1>
      </div>

      {/* Compose Box */}
      <div className="compose-box" onClick={() => dispatch(openModal("createPost"))}>
        <img
          src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.displayName}&background=7c3aed&color=fff`}
          className="avatar avatar-md"
          alt=""
        />
        <div className="compose-placeholder">What's happening?</div>
        <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); dispatch(openModal("createPost")); }}>
          Post
        </button>
      </div>

      <div className="divider" style={{ margin: 0 }} />

      {/* Feed */}
      {loading && feed.length === 0 ? (
        <>{[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}</>
      ) : feed.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌐</div>
          <h3>Your feed is quiet</h3>
          <p>Follow people to see their posts here, or explore to discover content.</p>
          <a href="/explore" className="btn btn-primary" style={{ marginTop: 8 }}>Explore</a>
        </div>
      ) : (
        <InfiniteScroll
          dataLength={feed.length}
          next={loadMore}
          hasMore={pagination.hasMore}
          loader={<PostSkeleton />}
          endMessage={
            <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)", fontSize: 14 }}>
              You're all caught up ✓
            </div>
          }
        >
          {feed.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </InfiniteScroll>
      )}

      <style>{`
        .page-container { min-height: 100vh; }
        .page-header {
          position: sticky; top: 0; z-index: 10;
          background: var(--bg-secondary);
          backdrop-filter: blur(12px);
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
        }
        .page-title { font-size: 18px; font-weight: 700; }
        .compose-box {
          display: flex; align-items: center; gap: 12; padding: 16px;
          cursor: pointer; border-bottom: 1px solid var(--border);
          transition: background var(--transition);
        }
        .compose-box:hover { background: var(--bg-hover); }
        .compose-placeholder {
          flex: 1; color: var(--text-muted); font-size: 16px; padding: 8px;
        }
        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          padding: 60px 24px; text-align: center; gap: 8px;
        }
        .empty-icon { font-size: 48px; margin-bottom: 8px; }
        .empty-state h3 { font-size: 18px; font-weight: 700; }
        .empty-state p { color: var(--text-muted); font-size: 14px; max-width: 280px; }
      `}</style>
    </div>
  );
}
