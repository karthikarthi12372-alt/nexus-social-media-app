import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
      <div style={{ fontSize: 72, fontWeight: 900, color: "var(--accent)", marginBottom: 8 }}>404</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>This page doesn't exist</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>The page you're looking for couldn't be found.</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );
}
