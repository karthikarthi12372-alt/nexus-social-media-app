import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../services/api.js";
import PostCard from "../components/post/PostCard.jsx";
import EditProfileModal from "../components/profile/EditProfileModal.jsx";
import toast from "react-hot-toast";

const TABS = ["Posts", "Media", "Likes"];

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((s) => s.auth);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwn = currentUser?.username === username;

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${username}`);
      setProfile(res.data.user);
      setIsFollowing(res.data.user.followers?.some((f) => f._id === currentUser?._id || f === currentUser?._id));
    } catch {
      navigate("/404");
    } finally {
      setLoading(false);
    }
  }, [username]);

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const res = await api.get(`/users/${username}/posts`);
      setPosts(res.data.posts);
    } catch {
      toast.error("Could not load posts");
    } finally {
      setPostsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [username]);

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      const res = await api.post(`/users/${profile._id}/follow`);
      setIsFollowing(res.data.following);
      setProfile((prev) => ({
        ...prev,
        followerCount: res.data.following ? (prev.followerCount || 0) + 1 : (prev.followerCount || 1) - 1,
      }));
    } catch {
      toast.error("Action failed");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return (
    <div style={{ padding: 16 }}>
      <div className="skeleton" style={{ height: 180, borderRadius: "var(--radius-md)", marginBottom: 16 }} />
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 96, height: 96, borderRadius: "50%", marginTop: -48 }} />
      </div>
      <div className="skeleton" style={{ height: 20, width: "40%", marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 16, width: "25%", marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 14, marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 14, width: "70%" }} />
    </div>
  );

  if (!profile) return null;

  const mediaPosts = posts.filter((p) => p.images?.length > 0);

  return (
    <div className="profile-page">
      {/* Cover Image */}
      <div className="cover-image">
        {profile.coverImage ? (
          <img src={profile.coverImage} alt="Cover" />
        ) : (
          <div className="cover-placeholder" />
        )}
      </div>

      {/* Profile Info */}
      <div className="profile-info">
        <div className="profile-header-row">
          <img
            src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.displayName}&background=7c3aed&color=fff&size=128`}
            alt={profile.displayName}
            className="avatar avatar-2xl profile-avatar"
          />
          <div className="profile-actions">
            {isOwn ? (
              <button className="btn btn-outline" onClick={() => setShowEditModal(true)}>
                Edit profile
              </button>
            ) : (
              <>
                <button
                  className={`btn ${isFollowing ? "btn-outline" : "btn-primary"}`}
                  onClick={handleFollow}
                  disabled={followLoading}
                >
                  {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
                </button>
                <button className="btn btn-outline" onClick={() => navigate(`/messages?user=${profile._id}`)}>
                  Message
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ padding: "12px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800 }}>{profile.displayName}</h1>
            {profile.isVerified && <span className="verified-icon">✓</span>}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 10 }}>@{profile.username}</div>

          {profile.bio && (
            <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 12, whiteSpace: "pre-wrap" }}>{profile.bio}</p>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 12, fontSize: 14, color: "var(--text-muted)" }}>
            {profile.location && <span>📍 {profile.location}</span>}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                🔗 {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 20, fontSize: 14 }}>
            <span>
              <strong style={{ fontWeight: 700 }}>{profile.postCount ?? 0}</strong>{" "}
              <span style={{ color: "var(--text-muted)" }}>Posts</span>
            </span>
            <button style={{ display: "flex", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>
              <strong style={{ fontWeight: 700 }}>{profile.followerCount ?? profile.followers?.length ?? 0}</strong>{" "}
              <span style={{ color: "var(--text-muted)" }}>Followers</span>
            </button>
            <button style={{ display: "flex", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>
              <strong style={{ fontWeight: 700 }}>{profile.followingCount ?? profile.following?.length ?? 0}</strong>{" "}
              <span style={{ color: "var(--text-muted)" }}>Following</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`profile-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "Posts" && (
          postsLoading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
          ) : posts.length === 0 ? (
            <div className="empty-state" style={{ padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{isOwn ? "Share your first post" : "No posts yet"}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                {isOwn ? "Your posts will appear here." : `${profile.displayName} hasn't posted yet.`}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post._id} post={post} onDeleted={(id) => setPosts((p) => p.filter((x) => x._id !== id))} />
            ))
          )
        )}

        {activeTab === "Media" && (
          mediaPosts.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>No media posts.</div>
          ) : (
            <div className="media-grid">
              {mediaPosts.map((post) =>
                post.images.map((img, i) => (
                  <div key={`${post._id}-${i}`} className="media-item" onClick={() => navigate(`/post/${post._id}`)}>
                    <img src={img.url} alt="" />
                  </div>
                ))
              )}
            </div>
          )
        )}

        {activeTab === "Likes" && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>
            Liked posts are private.
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => { setProfile((p) => ({ ...p, ...updated })); setShowEditModal(false); }}
        />
      )}

      <style>{`
        .profile-page { min-height: 100vh; }
        .cover-image { height: 180px; background: linear-gradient(135deg, var(--accent) 0%, #a855f7 100%); overflow: hidden; }
        .cover-image img { width: 100%; height: 100%; object-fit: cover; }
        .cover-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, var(--accent) 0%, #a855f7 100%); }
        .profile-info { padding: 0 0 16px; }
        .profile-header-row { display: flex; justify-content: space-between; align-items: flex-end; padding: 0 16px; margin-top: -48px; margin-bottom: 12px; }
        .profile-avatar { border: 4px solid var(--bg-secondary); box-shadow: var(--shadow-md); }
        .profile-actions { display: flex; gap: 8px; padding-top: 8px; }
        .profile-tabs { display: flex; border-bottom: 1px solid var(--border); sticky: top; }
        .profile-tab { flex: 1; padding: 14px; font-size: 14px; font-weight: 600; color: var(--text-muted); border-bottom: 2px solid transparent; transition: all var(--transition); background: none; border-left: none; border-right: none; border-top: none; cursor: pointer; }
        .profile-tab:hover { color: var(--text-primary); background: var(--bg-hover); }
        .profile-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
        .media-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        .media-item { aspect-ratio: 1; overflow: hidden; cursor: pointer; }
        .media-item img { width: 100%; height: 100%; object-fit: cover; transition: opacity var(--transition); }
        .media-item:hover img { opacity: 0.85; }
      `}</style>
    </div>
  );
}
