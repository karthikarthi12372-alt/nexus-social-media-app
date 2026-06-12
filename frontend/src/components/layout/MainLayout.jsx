import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import MobileNav from "./MobileNav.jsx";
import RightPanel from "./RightPanel.jsx";
import CreatePostModal from "../post/CreatePostModal.jsx";
import { useSelector } from "react-redux";

export default function MainLayout() {
  const { modals } = useSelector((s) => s.ui);

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar-desktop">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Right Panel (desktop only) */}
      <aside className="right-panel">
        <RightPanel />
      </aside>

      {/* Mobile Bottom Nav */}
      <MobileNav />

      {/* Global Modals */}
      {modals.createPost && <CreatePostModal />}

      <style>{`
        .app-layout {
          display: flex;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          min-height: 100vh;
          position: relative;
        }
        .sidebar-desktop {
          width: var(--sidebar-width);
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          border-right: 1px solid var(--border);
        }
        .main-content {
          flex: 1;
          min-width: 0;
          border-right: 1px solid var(--border);
        }
        .right-panel {
          width: var(--right-panel-width);
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          padding: 20px 16px;
        }
        @media (max-width: 1024px) {
          .right-panel { display: none; }
        }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none; }
          .main-content { padding-bottom: 70px; }
        }
      `}</style>
    </div>
  );
}
