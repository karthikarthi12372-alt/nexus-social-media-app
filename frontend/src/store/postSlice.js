import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api.js";

// ─── Post Thunks ──────────────────────────────────────────────────────────────

export const fetchFeed = createAsyncThunk("posts/fetchFeed", async (page = 1, { rejectWithValue }) => {
  try {
    const res = await api.get(`/posts/feed?page=${page}&limit=10`);
    return { ...res.data, page };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createPost = createAsyncThunk("posts/create", async (formData, { rejectWithValue }) => {
  try {
    const res = await api.post("/posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.post;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const deletePost = createAsyncThunk("posts/delete", async (postId, { rejectWithValue }) => {
  try {
    await api.delete(`/posts/${postId}`);
    return postId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const toggleLike = createAsyncThunk("posts/toggleLike", async (postId, { rejectWithValue }) => {
  try {
    const res = await api.post(`/posts/${postId}/like`);
    return { postId, ...res.data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const postSlice = createSlice({
  name: "posts",
  initialState: {
    feed: [],
    loading: false,
    error: null,
    pagination: { page: 1, hasMore: true },
  },
  reducers: {
    prependPost(state, action) {
      state.feed.unshift(action.payload);
    },
    removePost(state, action) {
      state.feed = state.feed.filter((p) => p._id !== action.payload);
    },
    updatePostInFeed(state, action) {
      const idx = state.feed.findIndex((p) => p._id === action.payload._id);
      if (idx !== -1) state.feed[idx] = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => { state.loading = true; })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.page === 1) {
          state.feed = action.payload.posts;
        } else {
          state.feed = [...state.feed, ...action.payload.posts];
        }
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.feed.unshift(action.payload);
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.feed = state.feed.filter((p) => p._id !== action.payload);
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const post = state.feed.find((p) => p._id === action.payload.postId);
        if (post) {
          post.likeCount = action.payload.likeCount;
        }
      });
  },
});

export const { prependPost, removePost, updatePostInFeed } = postSlice.actions;
export const postReducer = postSlice.reducer;
export default postReducer;
