import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface BannerState {
  lastDismissedAt: number | null;
  shouldShow: () => boolean;
  dismiss: () => void;
  reset: () => void;
}

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export const useBannerStore = create<BannerState>()(
  persist(
    (set, get) => ({
      lastDismissedAt: null,

      shouldShow: () => {
        const lastDismissed = get().lastDismissedAt;
        if (!lastDismissed) return true;
        return Date.now() - lastDismissed > TWENTY_FOUR_HOURS;
      },

      dismiss: () => {
        set({ lastDismissedAt: Date.now() });
      },

      reset: () => {
        set({ lastDismissedAt: null });
      },
    }),
    {
      name: "tredro-banner",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
