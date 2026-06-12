import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice.js";
import { openModal, toggleTheme } from "../../store/uiSlice.js";

const NAV_ITEMS = [
  { to: "/", icon: "⬡", label: "Home", exact: true },
  { to: "/explore", icon: "🔭", label: "Explore" },
  { to: "/notifications", icon: "🔔", label: "Notifications" },
  { to: "/messages", icon: "✉", label: "Messages" },
  { to: "/search", icon: "⌕", label: "Search" },
  { to: "/settings", icon: "⚙", label: "Settings" },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { theme } = useSelector((s) => s.ui);
  const { unreadCount } = useSelector((s) => s.notifications);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <nav className="sidebar-nav">
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="logo-mark">N</span>
        <span className="logo-text">nexus</span>
      </div>

      {/* Nav Links */}
      <ul className="nav-list">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">
                {item.label}
                {item.label === "Notifications" && unreadCount > 0 && (
                  <span className="badge badge-accent" style={{ marginLeft: 6, fontSize: 10 }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Create Post */}
      <button
        className="btn btn-primary w-full"
        style={{ marginTop: 16, marginBottom: 8 }}
        onClick={() => dispatch(openModal("createPost"))}
      >
        + New Post
      </button>

      {/* Bottom Section */}
      <div className="sidebar-bottom">
        {/* Theme Toggle */}
        <button className="theme-toggle" onClick={() => dispatch(toggleTheme())}>
          <span>{theme === "dark" ? "☀" : "🌙"}</span>
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>

        {/* User Profile Link */}
        {user && (
          <NavLink to={`/${user.username}`} className="sidebar-user">
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${user.displayName}&background=7c3aed&color=fff`}
              alt={user.displayName}
              className="avatar avatar-sm"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="font-semibold text-sm truncate">{user.displayName}</div>
              <div className="text-xs text-muted truncate">@{user.username}</div>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); handleLogout(); }}
              style={{ padding: "4px 8px", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--text-muted)" }}
              className="btn-ghost"
            >
              ↩
            </button>
          </NavLink>
        )}
      </div>

      <style>{`
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 20px 16px;
        }
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
          padding: 4px 8px;
        }
        .logo-mark {
          width: 36px;
          height: 36px;
          background: var(--accent);
          color: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
        }
        .logo-text {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .nav-list { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 15px;
          font-weight: 500;
          transition: all var(--transition);
        }
        .nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
        .nav-item.active { background: var(--accent-light); color: var(--accent); font-weight: 600; }
        .nav-icon { font-size: 20px; width: 24px; text-align: center; }
        .nav-label { display: flex; align-items: center; }
        .sidebar-bottom { margin-top: auto; display: flex; flex-direction: column; gap: 8px; }
        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 14px;
          transition: all var(--transition);
          width: 100%;
        }
        .theme-toggle:hover { background: var(--bg-hover); color: var(--text-primary); }
        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          transition: background var(--transition);
        }
        .sidebar-user:hover { background: var(--bg-hover); }
      `}</style>
    </nav>
  );
}
