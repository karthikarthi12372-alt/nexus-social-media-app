import { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { updateProfile } from "../../store/authSlice.js";
import toast from "react-hot-toast";

export default function EditProfileModal({ profile, onClose, onSaved }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    displayName: profile.displayName || "",
    bio: profile.bio || "",
    website: profile.website || "",
    location: profile.location || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar || "");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (avatarFile) fd.append("avatar", avatarFile);

      const result = await dispatch(updateProfile(fd)).unwrap();
      toast.success("Profile updated!");
      onSaved(result.user);
    } catch (err) {
      toast.error(err || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Edit Profile</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Avatar Upload */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <img
                src={avatarPreview || `https://ui-avatars.com/api/?name=${form.displayName}&background=7c3aed&color=fff`}
                className="avatar avatar-xl"
                alt=""
              />
              <button
                type="button"
                onClick={() => fileRef.current.click()}
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", border: "none", cursor: "pointer" }}
              >
                📷
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{form.displayName}</div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current.click()}>
                Change photo
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input className="input" value={form.displayName} maxLength={50}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
          </div>

          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="input" value={form.bio} maxLength={160} rows={3}
              placeholder="Tell people about yourself..."
              onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>{form.bio.length}/160</div>
          </div>

          <div className="form-group">
            <label className="form-label">Website</label>
            <input className="input" type="url" value={form.website} placeholder="https://yoursite.com"
              onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="input" value={form.location} placeholder="City, Country" maxLength={50}
              onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>

        <style>{`
          .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; backdrop-filter: blur(4px); }
          .modal-box { background: var(--bg-secondary); border-radius: var(--radius-lg); padding: 24px; width: 100%; box-shadow: var(--shadow-lg); animation: fadeIn 0.15s ease; max-height: 90vh; overflow-y: auto; }
          .icon-btn { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--text-muted); background: none; border: none; cursor: pointer; }
          .icon-btn:hover { background: var(--bg-hover); }
        `}</style>
      </div>
    </div>
  );
}
