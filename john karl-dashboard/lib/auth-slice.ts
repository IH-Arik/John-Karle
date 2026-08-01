import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PublicUser } from "./types";

type AuthState = {
  user: PublicUser | null;
  isInitialized: boolean;
};

const initialState: AuthState = {
  user: null,
  isInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<PublicUser | null>) {
      state.user = action.payload;
      state.isInitialized = true;
    },
    markInitialized(state) {
      state.isInitialized = true;
    },
    clearSession(state) {
      state.user = null;
      state.isInitialized = true;
    },
  },
});

export const { setSession, markInitialized, clearSession } = authSlice.actions;
export const authReducer = authSlice.reducer;
