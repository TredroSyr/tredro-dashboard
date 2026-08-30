"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CustomersViewMode } from "@/module/customers/_components/customers-view-mode";

interface CustomersViewState {
  viewMode: CustomersViewMode;
  setViewMode: (mode: CustomersViewMode) => void;
}

export const useCustomersViewStore = create<CustomersViewState>()(
  persist(
    (set) => ({
      viewMode: "table",
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    {
      name: "tredro-customers-view",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
