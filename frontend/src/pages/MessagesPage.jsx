import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { formatDistanceToNow } from "date-fns";
import api from "../services/api.js";
import { getSocket } from "../services/socket.js";
import {
  setConversations, setActiveConversation, setMessages, appendMessage,
  setTyping, clearTyping, updateLastMessage,
} from "../store/chatSlice.js";

export default function MessagesPage() {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { conversations, activeConversation, messages, onlineUsers, typingUsers } = useSelector((s) => s.chat);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ─── Load conversations list ────────────────────────────────────────────
  useEffect(() => {
    api.get("/chat/conversations").then((r) => dispatch(setConversations(r.data.conversations)));
  }, []);

  // ─── Start conversation from profile "Message" button ───────────────────
  useEffect(() => {
    const startUserId = searchParams.get("user");
    if (startUserId) {
      api.get(`/chat/conversations/${startUserId}/start`).then((r) => {
        navigate(`/messages/${r.data.conversation._id}`, { replace: true });
      });
    }
  }, [searchParams]);

  // ─── Load active conversation + messages ─────────────────────────────────
  useEffect(() => {
    if (!conversationId) {
      dispatch(setActiveConversation(null));
      return;
    }

    const conv = conversations.find((c) => c._id === conversationId);
    if (conv) dispatch(setActiveConversation(conv));

    api.get(`/chat/${conversationId}/messages`).then((r) => dispatch(setMessages(r.data.messages)));

    const socket = getSocket();
    socket?.emit("joinConversation", conversationId);

    return () => socket?.emit("leaveConversation", conversationId);
  }, [conversationId, conversations.length]);

  // ─── Socket: incoming messages ────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = ({ message, conversationId: cid }) => {
      if (cid === conversationId) {
        dispatch(appendMessage(message));
      }
      dispatch(updateLastMessage({ conversationId: cid, message }));
    };

    const handleTyping = ({ conversationId: cid, userId }) => {
      if (cid === conversationId) dispatch(setTyping({ conversationId: cid, userId }));
    };

    const handleStopTyping = ({ conversationId: cid }) => {
      dispatch(clearTyping(cid));
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [conversationId]);

  // ─── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getOtherUser = (conv) => conv?.participants?.find((p) => p._id !== user?._id);

  // ─── Send Message ──────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);

    try {
      const res = await api.post(`/chat/${conversationId}/messages`, { text: text.trim() });
      dispatch(appendMessage(res.data.message));
      dispatch(updateLastMessage({ conversationId, message: res.data.message }));
      setText("");

      const otherUser = getOtherUser(activeConversation);
      getSocket()?.emit("stopTyping", { conversationId, recipientId: otherUser?._id });
    } finally {
      setSending(false);
    }
  };

  // ─── Typing Indicator ──────────────────────────────────────────────────────
  const handleTextChange = (e) => {
    setText(e.target.value);
    const otherUser = getOtherUser(activeConversation);
    if (!otherUser) return;

    getSocket()?.emit("typing", { conversationId, recipientId: otherUser._id });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      getSocket()?.emit("stopTyping", { conversationId, recipientId: otherUser._id });
    }, 1500);
  };

  const isOtherTyping = typingUsers[conversationId] && typingUsers[conversationId] !== user?._id;

  return (
    <div className="messages-layout">
      {/* Conversation List */}
      <div className={`conv-list ${conversationId ? "hide-mobile" : ""}`}>
        <div className="page-header">
          <h1 className="page-title">Messages</h1>
        </div>

        {conversations.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✉</div>
            No conversations yet. Visit a profile and tap "Message" to start chatting.
          </div>
        ) : (
          conversations.map((conv) => {
            const other = getOtherUser(conv);
            const isOnline = onlineUsers.includes(other?._id);
            return (
              <div
                key={conv._id}
                className={`conv-item ${conv._id === conversationId ? "active" : ""}`}
                onClick={() => navigate(`/messages/${conv._id}`)}
              >
                <div style={{ position: "relative" }}>
                  <img src={other?.avatar || `https://ui-avatars.com/api/?name=${other?.displayName}&background=7c3aed&color=fff`} className="avatar avatar-md" alt="" />
                  {isOnline && <span className="online-dot" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="font-semibold text-sm truncate">{other?.displayName}</span>
                    {conv.lastMessage && <span className="text-xs text-muted">{formatDistanceToNow(new Date(conv.lastMessage.createdAt))}</span>}
                  </div>
                  <p className="text-xs text-muted truncate">
                    {conv.lastMessage?.sender?._id === user?._id ? "You: " : ""}
                    {conv.lastMessage?.text || "Say hello 👋"}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Chat Window */}
      <div className={`chat-window ${!conversationId ? "hide-mobile" : ""}`}>
        {!conversationId ? (
          <div className="chat-empty">
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <h3 style={{ fontWeight: 700 }}>Select a conversation</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Choose from your existing conversations or start a new one from a profile.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="chat-header">
              <button className="icon-btn hide-desktop" onClick={() => navigate("/messages")}>←</button>
              {activeConversation && (
                <>
                  <img
                    src={getOtherUser(activeConversation)?.avatar || `https://ui-avatars.com/api/?name=${getOtherUser(activeConversation)?.displayName}&background=7c3aed&color=fff`}
                    className="avatar avatar-sm"
                    alt=""
                  />
                  <div>
                    <div className="font-semibold text-sm">{getOtherUser(activeConversation)?.displayName}</div>
                    <div className="text-xs text-muted">
                      {onlineUsers.includes(getOtherUser(activeConversation)?._id) ? "Online" : "Offline"}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="messages-scroll">
              {messages.map((msg, i) => {
                const isMine = msg.sender?._id === user?._id;
                const showAvatar = !isMine && (i === 0 || messages[i - 1]?.sender?._id !== msg.sender?._id);
                return (
                  <div key={msg._id} className={`message-row ${isMine ? "mine" : "theirs"}`}>
                    {!isMine && (
                      <img
                        src={msg.sender?.avatar || `https://ui-avatars.com/api/?name=${msg.sender?.displayName}&background=7c3aed&color=fff`}
                        className="avatar avatar-xs"
                        style={{ visibility: showAvatar ? "visible" : "hidden" }}
                        alt=""
                      />
                    )}
                    <div className="message-bubble">
                      {msg.text}
                      <span className="message-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                );
              })}

              {isOtherTyping && (
                <div className="message-row theirs">
                  <div className="avatar avatar-xs" />
                  <div className="message-bubble typing-bubble">
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form className="chat-input-bar" onSubmit={handleSend}>
              <input
                className="input"
                placeholder="Type a message..."
                value={text}
                onChange={handleTextChange}
                maxLength={2000}
              />
              <button type="submit" className="btn btn-primary" disabled={!text.trim() || sending}>Send</button>
            </form>
          </>
        )}
      </div>

      <style>{`
        .messages-layout { display: flex; height: 100vh; }
        .conv-list { width: 100%; max-width: 340px; border-right: 1px solid var(--border); overflow-y: auto; flex-shrink: 0; }
        .page-header { position: sticky; top: 0; background: var(--bg-secondary); backdrop-filter: blur(12px); padding: 14px 16px; border-bottom: 1px solid var(--border); z-index: 5; }
        .page-title { font-size: 18px; font-weight: 700; }
        .conv-item { display: flex; gap: 10px; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid var(--border); transition: background var(--transition); align-items: center; }
        .conv-item:hover { background: var(--bg-hover); }
        .conv-item.active { background: var(--accent-light); }
        .online-dot { position: absolute; bottom: -2px; right: -2px; width: 11px; height: 11px; background: var(--success); border: 2px solid var(--bg-secondary); border-radius: 50%; }
        .chat-window { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .chat-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px; }
        .chat-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--border); background: var(--bg-secondary); position: sticky; top: 0; z-index: 5; }
        .messages-scroll { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
        .message-row { display: flex; align-items: flex-end; gap: 8px; max-width: 75%; }
        .message-row.mine { align-self: flex-end; flex-direction: row-reverse; }
        .message-row.theirs { align-self: flex-start; }
        .message-bubble { padding: 9px 14px; border-radius: 16px; font-size: 14px; line-height: 1.4; position: relative; word-break: break-word; }
        .message-row.mine .message-bubble { background: var(--accent); color: #fff; border-bottom-right-radius: 4px; }
        .message-row.theirs .message-bubble { background: var(--bg-tertiary); border-bottom-left-radius: 4px; }
        .message-time { display: block; font-size: 10px; opacity: 0.6; margin-top: 2px; text-align: right; }
        .chat-input-bar { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--border); background: var(--bg-secondary); }
        .icon-btn { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--text-secondary); background: none; border: none; cursor: pointer; }
        .icon-btn:hover { background: var(--bg-hover); }
        .hide-desktop { display: none; }
        .typing-bubble { display: flex; gap: 3px; padding: 12px 14px; }
        .typing-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); animation: pulse-dot 1s infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @media (max-width: 768px) {
          .messages-layout { height: calc(100vh - 60px); }
          .conv-list { max-width: 100%; }
          .hide-mobile { display: none; }
          .hide-desktop { display: flex; }
        }
      `}</style>
    </div>
  );
}
