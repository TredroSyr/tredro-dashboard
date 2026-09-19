"use client";

import { create } from "zustand";

/**
 * Sidebar items (by navConfig key) that received a new notification the user
 * hasn't "seen" yet. Drives the attention animation — cleared as soon as the
 * user visits the item's page. Intentionally in-memory: it's a "just arrived"
 * cue, while the persistent unread count lives in the badge.
 */
type NavAlertsStore = {
  alerts: Record<string, boolean>;
  flag: (key: string) => void;
  clear: (key: string) => void;
};

export const useNavAlertsStore = create<NavAlertsStore>((set) => ({
  alerts: {},
  flag: (key) =>
    set((state) =>
      state.alerts[key] ? state : { alerts: { ...state.alerts, [key]: true } },
    ),
  clear: (key) =>
    set((state) => {
      if (!state.alerts[key]) return state;
      const next = { ...state.alerts };
      delete next[key];
      return { alerts: next };
    }),
}));
