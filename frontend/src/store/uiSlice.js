import { createSlice } from "@reduxjs/toolkit";

const savedTheme = localStorage.getItem("nexus_theme") || "light";
if (savedTheme === "dark") document.documentElement.setAttribute("data-theme", "dark");

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    theme: savedTheme,
    modals: { createPost: false, editProfile: false },
    mobileMenuOpen: false,
  },
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("nexus_theme", state.theme);
      document.documentElement.setAttribute("data-theme", state.theme);
    },
    openModal(state, action) { state.modals[action.payload] = true; },
    closeModal(state, action) { state.modals[action.payload] = false; },
    setMobileMenu(state, action) { state.mobileMenuOpen = action.payload; },
  },
});

export const { toggleTheme, openModal, closeModal, setMobileMenu } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
export default uiReducer;
