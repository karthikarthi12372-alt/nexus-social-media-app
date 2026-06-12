import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createPost } from "../../store/postSlice.js";
import { closeModal } from "../../store/uiSlice.js";
import toast from "react-hot-toast";

export default function CreatePostModal() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 4 - images.length);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (i) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!text.trim() && images.length === 0) {
      return toast.error("Write something or add an image!");
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("text", text);
      images.forEach((img) => fd.append("images", img));

      await dispatch(createPost(fd)).unwrap();
      toast.success("Post published!");
      dispatch(closeModal("createPost"));
    } catch (err) {
      toast.error(err || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => dispatch(closeModal("createPost"))}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>New Post</h2>
          <button className="icon-btn" onClick={() => dispatch(closeModal("createPost"))}>✕</button>
        </div>

        {/* Author */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.displayName}&background=7c3aed&color=fff`}
            className="avatar avatar-md"
            alt=""
          />
          <div style={{ flex: 1 }}>
            <div className="font-semibold text-sm">{user?.displayName}</div>
            <div className="text-xs text-muted">@{user?.username}</div>
          </div>
        </div>

        {/* Text Input */}
        <textarea
          className="input"
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          rows={4}
          autoFocus
          style={{ resize: "none", marginBottom: 8 }}
        />
        <div style={{ textAlign: "right", fontSize: 12, color: text.length > 450 ? "var(--danger)" : "var(--text-muted)", marginBottom: 12 }}>
          {text.length}/500
        </div>

        {/* Image Previews */}
        {previews.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {previews.map((src, i) => (
              <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius-sm)" }} />
                <button onClick={() => removeImage(i)} style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, background: "rgba(0,0,0,0.7)", color: "#fff", borderRadius: "50%", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => fileRef.current.click()}
              disabled={images.length >= 4}
            >
              📷 {images.length > 0 ? `${images.length}/4` : "Photo"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleImages} />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || (!text.trim() && images.length === 0)}
          >
            {loading ? "Publishing..." : "Publish"}
          </button>
        </div>

        <style>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 16px;
            backdrop-filter: blur(4px);
          }
          .modal-box {
            background: var(--bg-secondary);
            border-radius: var(--radius-lg);
            padding: 20px;
            width: 100%;
            max-width: 540px;
            box-shadow: var(--shadow-lg);
            animation: fadeIn 0.15s ease;
          }
          .icon-btn {
            width: 32px; height: 32px; border-radius: 50%; display: flex;
            align-items: center; justify-content: center; font-size: 16px;
            color: var(--text-muted); transition: background var(--transition);
            background: none; border: none; cursor: pointer;
          }
          .icon-btn:hover { background: var(--bg-hover); }
        `}</style>
      </div>
    </div>
  );
}
