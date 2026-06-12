import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import api from "../services/api.js";
import { setNotifications, markAllRead } from "../store/notificationSlice.js";

const ICONS = {
  like: { icon: "♥", color: "#e11d48" },
  comment: { icon: "💬", color: "#0891b2" },
  follow: { icon: "👤", color: "#7c3aed" },
  mention: { icon: "@", color: "#d97706" },
  repost: { icon: "↺", color: "#059669" },
  reply: { icon: "↩", color: "#0891b2" },
};

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const { items, unreadCount } = useSelector((s) => s.notifications);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      dispatch(setNotifications(res.data));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    await api.put("/notifications/read-all");
    dispatch(markAllRead());
  };

  const getMessage = (n) => {
    switch (n.type) {
      case "like": return "liked your post";
      case "comment": return "commented on your post";
      case "follow": return "started following you";
      case "mention": return "mentioned you";
      case "repost": return "reposted your post";
      default: return "interacted with your content";
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="page-title">Notifications</h1>
        {unreadCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>Mark all read</button>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ padding: "60px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
          <h3 style={{ fontWeight: 700, marginBottom: 4 }}>No notifications yet</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>When someone interacts with your posts, you'll see it here.</p>
        </div>
      ) : (
        items.map((n) => {
          const cfg = ICONS[n.type] || ICONS.like;
          return (
            <Link
              key={n._id}
              to={n.post ? `/post/${n.post._id || n.post}` : `/${n.sender?.username}`}
              className="notif-item"
              style={{ background: n.isRead ? "transparent" : "var(--accent-light)" }}
            >
              <div className="notif-icon" style={{ color: cfg.color }}>{cfg.icon}</div>
              <img
                src={n.sender?.avatar || `https://ui-avatars.com/api/?name=${n.sender?.displayName}&background=7c3aed&color=fff`}
                className="avatar avatar-sm"
                alt=""
              />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14 }}>
                  <strong>{n.sender?.displayName}</strong> {getMessage(n)}
                  {n.comment && <span style={{ display: "block", color: "var(--text-muted)", marginTop: 2 }}>"{n.comment.slice(0, 60)}"</span>}
                </p>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
              </div>
            </Link>
          );
        })
      )}

      <style>{`
        .page-container { min-height: 100vh; }
        .page-header { position: sticky; top: 0; z-index: 10; background: var(--bg-secondary); backdrop-filter: blur(12px); padding: 14px 16px; border-bottom: 1px solid var(--border); }
        .page-title { font-size: 18px; font-weight: 700; }
        .notif-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--border); transition: background var(--transition); }
        .notif-item:hover { background: var(--bg-hover); }
        .notif-icon { font-size: 18px; width: 24px; text-align: center; }
      `}</style>
    </div>
  );
}
