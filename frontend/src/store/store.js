import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice.js";
import postReducer from "./postSlice.js";
import notificationReducer from "./notificationSlice.js";
import chatReducer from "./chatSlice.js";
import uiReducer from "./uiSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postReducer,
    notifications: notificationReducer,
    chat: chatReducer,
    ui: uiReducer,
  },
});
