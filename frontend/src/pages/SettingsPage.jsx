import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleTheme } from "../store/uiSlice.js";
import { logout } from "../store/authSlice.js";

export default function SettingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useSelector((s) => s.ui);
  const { user } = useSelector((s) => s.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div style={{ padding: 16 }}>
        {/* Appearance */}
        <section className="settings-section">
          <h3 className="settings-heading">Appearance</h3>
          <div className="settings-row">
            <div>
              <div className="font-medium">Theme</div>
              <div className="text-xs text-muted">Switch between light and dark mode</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => dispatch(toggleTheme())}>
              {theme === "dark" ? "🌙 Dark" : "☀ Light"}
            </button>
          </div>
        </section>

        {/* Account */}
        <section className="settings-section">
          <h3 className="settings-heading">Account</h3>
          <div className="settings-row">
            <div>
              <div className="font-medium">Username</div>
              <div className="text-xs text-muted">@{user?.username}</div>
            </div>
          </div>
          <div className="settings-row">
            <div>
              <div className="font-medium">Email</div>
              <div className="text-xs text-muted">{user?.email}</div>
            </div>
          </div>
          <div className="settings-row">
            <div>
              <div className="font-medium">Private Account</div>
              <div className="text-xs text-muted">Only approved followers can see your posts</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked={user?.isPrivate} />
              <span className="slider" />
            </label>
          </div>
        </section>

        {/* About */}
        <section className="settings-section">
          <h3 className="settings-heading">About</h3>
          <div className="settings-row"><span>Version</span><span className="text-muted">1.0.0</span></div>
          <div className="settings-row"><span>Built with</span><span className="text-muted">React + Node.js</span></div>
        </section>

        <button className="btn btn-danger w-full" style={{ marginTop: 12 }} onClick={handleLogout}>
          Log out
        </button>
      </div>

      <style>{`
        .page-container { min-height: 100vh; }
        .page-header { position: sticky; top: 0; z-index: 10; background: var(--bg-secondary); backdrop-filter: blur(12px); padding: 14px 16px; border-bottom: 1px solid var(--border); }
        .page-title { font-size: 18px; font-weight: 700; }
        .settings-section { margin-bottom: 24px; }
        .settings-heading { font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .settings-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
        .switch { position: relative; display: inline-block; width: 40px; height: 22px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; inset: 0; background: var(--border-strong); border-radius: 22px; transition: 0.2s; }
        .slider::before { content: ""; position: absolute; height: 16px; width: 16px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s; }
        .switch input:checked + .slider { background: var(--accent); }
        .switch input:checked + .slider::before { transform: translateX(18px); }
      `}</style>
    </div>
  );
}
