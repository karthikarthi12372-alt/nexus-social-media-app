import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";

export default function MobileNav() {
  const { unreadCount } = useSelector((s) => s.notifications);
  const { user } = useSelector((s) => s.auth);

  const items = [
    { to: "/", icon: "⬡", exact: true },
    { to: "/explore", icon: "🔭" },
    { to: "/notifications", icon: "🔔", badge: unreadCount },
    { to: "/messages", icon: "✉" },
    { to: user ? `/${user.username}` : "/", icon: null, isAvatar: true },
  ];

  return (
    <nav className="mobile-nav">
      {items.map((item, i) => (
        <NavLink key={i} to={item.to} end={item.exact} className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
          {item.isAvatar && user ? (
            <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.displayName}&background=7c3aed&color=fff`} className="avatar avatar-xs" alt="" />
          ) : (
            <span style={{ fontSize: 22, position: "relative" }}>
              {item.icon}
              {item.badge > 0 && <span className="badge badge-danger" style={{ position: "absolute", top: -4, right: -4, fontSize: 9, padding: "1px 4px", minWidth: 14 }}>{item.badge}</span>}
            </span>
          )}
        </NavLink>
      ))}
      <style>{`
        .mobile-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border);
          z-index: 100;
          padding: 0 16px;
        }
        @media (max-width: 768px) { .mobile-nav { display: flex; align-items: center; justify-content: space-around; } }
        .mobile-nav-item { display: flex; align-items: center; justify-content: center; padding: 10px; border-radius: var(--radius-md); color: var(--text-secondary); transition: color var(--transition); position: relative; }
        .mobile-nav-item.active { color: var(--accent); }
      `}</style>
    </nav>
  );
}
