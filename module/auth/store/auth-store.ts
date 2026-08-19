import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AuthUser, Tokens } from "../types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;

  // Sets user + both tokens at once (e.g. after login)
  setAuth: (user: AuthUser, tokens: Tokens) => void;

  // Updates only the access token (e.g. after a silent refresh)
  setAccessToken: (accessToken: string) => void;

  // Updates only the refresh token (rare, but kept for symmetry / rotation flows)
  setRefreshToken: (refreshToken: string) => void;

  // Partially updates the logged-in user's info
  updateUser: (user: Partial<AuthUser>) => void;

  // Clears everything (logout / invalid refresh token)
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setAuth: (user, tokens) =>
        set({
          user,
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
          isAuthenticated: true,
        }),

      // Only touches accessToken — used after a token refresh so we don't
      // accidentally wipe/overwrite the user or refreshToken
      setAccessToken: (accessToken) =>
        set({
          accessToken,
          isAuthenticated: true,
        }),

      // Only touches refreshToken
      setRefreshToken: (refreshToken) =>
        set({
          refreshToken,
        }),

      updateUser: (partial) =>
        set({
          user: get().user ? { ...get().user!, ...partial } : null,
        }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "tredro-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
