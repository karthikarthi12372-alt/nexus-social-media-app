import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, clearError } from "../store/authSlice.js";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ username: "", email: "", password: "", displayName: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    try {
      await dispatch(registerUser(form)).unwrap();
      navigate("/");
      toast.success("Welcome to Nexus!");
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-logo">N</div>
        <h1>nexus</h1>
        <p>Join the conversation.</p>
      </div>

      <div className="auth-card">
        <h2>Create your account</h2>
        <p className="auth-sub">It's free and always will be.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input type="text" className="input" placeholder="Your Name" value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" className="input" placeholder="@handle" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "") })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="input" placeholder="you@example.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="input" placeholder="Min 6 characters" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} required />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
            By signing up you agree to our Terms of Service.
          </p>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in →</Link>
        </div>
      </div>

      <style>{`
        .auth-page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 16px; gap: 32px; background: var(--bg-primary); }
        .auth-brand { text-align: center; }
        .auth-logo { width: 56px; height: 56px; background: var(--accent); color: white; border-radius: 16px; font-size: 28px; font-weight: 900; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
        .auth-brand h1 { font-size: 28px; font-weight: 800; letter-spacing: -1px; }
        .auth-brand p { color: var(--text-muted); font-size: 14px; margin-top: 4px; }
        .auth-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 32px; width: 100%; max-width: 440px; box-shadow: var(--shadow-md); }
        .auth-card h2 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        .auth-sub { color: var(--text-muted); font-size: 14px; margin-bottom: 24px; }
        .auth-form { display: flex; flex-direction: column; gap: 14px; }
        .auth-footer { text-align: center; margin-top: 20px; font-size: 14px; color: var(--text-secondary); }
        .auth-footer a { color: var(--accent); font-weight: 600; }
        .error-msg { background: #fee2e2; color: var(--danger); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 13px; }
      `}</style>
    </div>
  );
}
