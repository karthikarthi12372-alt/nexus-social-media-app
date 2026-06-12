import { createSlice } from "@reduxjs/toolkit";

// ─── Chat Slice ───────────────────────────────────────────────────────────────
const chatSlice = createSlice({
  name: "chat",
  initialState: {
    conversations: [],
    activeConversation: null,
    messages: [],
    onlineUsers: [],
    typingUsers: {},
  },
  reducers: {
    setConversations(state, action) { state.conversations = action.payload; },
    setActiveConversation(state, action) { state.activeConversation = action.payload; },
    setMessages(state, action) { state.messages = action.payload; },
    appendMessage(state, action) { state.messages.push(action.payload); },
    prependMessages(state, action) { state.messages = [...action.payload, ...state.messages]; },
    setOnlineUsers(state, action) { state.onlineUsers = action.payload; },
    userCameOnline(state, action) {
      if (!state.onlineUsers.includes(action.payload)) state.onlineUsers.push(action.payload);
    },
    userWentOffline(state, action) {
      state.onlineUsers = state.onlineUsers.filter((id) => id !== action.payload);
    },
    setTyping(state, action) {
      state.typingUsers[action.payload.conversationId] = action.payload.userId;
    },
    clearTyping(state, action) {
      delete state.typingUsers[action.payload];
    },
    updateLastMessage(state, action) {
      const conv = state.conversations.find((c) => c._id === action.payload.conversationId);
      if (conv) conv.lastMessage = action.payload.message;
    },
  },
});

export const {
  setConversations, setActiveConversation, setMessages, appendMessage,
  prependMessages, setOnlineUsers, userCameOnline, userWentOffline,
  setTyping, clearTyping, updateLastMessage,
} = chatSlice.actions;
export const chatReducer = chatSlice.reducer;
export default chatReducer;
