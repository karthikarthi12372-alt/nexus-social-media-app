import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import { fetchCurrentUser } from "./store/authSlice.js";
import { initSocket, disconnectSocket } from "./services/socket.js";
import { addNotification } from "./store/notificationSlice.js";
import { userCameOnline, userWentOffline } from "./store/chatSlice.js";

// Layout
import MainLayout from "./components/layout/MainLayout.jsx";

// Pages
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import PostPage from "./pages/PostPage.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import MessagesPage from "./pages/MessagesPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, initialized } = useSelector((s) => s.auth);
  if (!initialized) return <div className="page-loader"><div className="loader-ring" /></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

export default function App() {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((s) => s.auth);

  // Bootstrap: fetch current user if token exists
  useEffect(() => {
    if (token) dispatch(fetchCurrentUser());
  }, []);

  // Initialize socket when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      const socket = initSocket(token);

      socket.on("notification", (data) => {
        dispatch(addNotification(data));
      });

      socket.on("userOnline", (userId) => dispatch(userCameOnline(userId)));
      socket.on("userOffline", (userId) => dispatch(userWentOffline(userId)));

      return () => disconnectSocket();
    }
  }, [isAuthenticated, token]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            fontSize: "14px",
          },
        }}
      />
      <Routes>
        {/* Guest routes */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* Protected routes (inside main layout) */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:conversationId" element={<MessagesPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/:username" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
