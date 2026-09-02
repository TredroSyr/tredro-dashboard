import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { StockTransferLine } from "../types";

interface PreparedLine {
  lineId: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: string;
  unitName: string;
  checked: boolean;
}

interface PreparationItem {
  transferId: number;
  transferNumber: string;
  lines: PreparedLine[];
  startedAt: number;
  expiresAt: number;
}

interface PreparationState {
  preparations: PreparationItem[];

  // Start preparing a transfer
  startPreparation: (
    transferId: number,
    transferNumber: string,
    lines: StockTransferLine[],
  ) => void;

  // Toggle checked status of a line
  toggleLine: (transferId: number, lineId: number) => void;

  // Check if a transfer is being prepared
  getPreparation: (transferId: number) => PreparationItem | undefined;

  // Check if preparation is expired
  isExpired: (item: PreparationItem) => boolean;

  // Clear expired preparations
  clearExpired: () => void;

  // Mark preparation as complete
  completePreparation: (transferId: number) => void;

  // Remove preparation
  removePreparation: (transferId: number) => void;

  // Get all active preparations
  getActivePreparations: () => PreparationItem[];
}

const ONE_HOUR = 60 * 60 * 1000;

export const usePreparationStore = create<PreparationState>()(
  persist(
    (set, get) => ({
      preparations: [],

      startPreparation: (transferId, transferNumber, lines) => {
        const now = Date.now();
        const newItem: PreparationItem = {
          transferId,
          transferNumber,
          lines: lines.map((l) => ({
            lineId: l.id,
            productId: l.product,
            productName: l.product_name,
            productSku: l.product_sku,
            quantity: l.effective_qty,
            unitName: l.unit_name,
            checked: false,
          })),
          startedAt: now,
          expiresAt: now + ONE_HOUR,
        };

        set((state) => {
          const filtered = state.preparations.filter((p) => p.transferId !== transferId);
          return {
            preparations: [...filtered, newItem],
          };
        });
      },

      toggleLine: (transferId, lineId) => {
        set((state) => ({
          preparations: state.preparations.map((p) => {
            if (p.transferId !== transferId) return p;
            return {
              ...p,
              lines: p.lines.map((l) => {
                if (l.lineId !== lineId) return l;
                return { ...l, checked: !l.checked };
              }),
            };
          }),
        }));
      },

      getPreparation: (transferId) => {
        const state = get();
        return state.preparations.find((p) => p.transferId === transferId);
      },

      isExpired: (item) => {
        return Date.now() > item.expiresAt;
      },

      clearExpired: () => {
        set((state) => ({
          preparations: state.preparations.filter((p) => Date.now() <= p.expiresAt),
        }));
      },

      completePreparation: (transferId) => {
        set((state) => ({
          preparations: state.preparations.filter((p) => p.transferId !== transferId),
        }));
      },

      removePreparation: (transferId) => {
        set((state) => ({
          preparations: state.preparations.filter((p) => p.transferId !== transferId),
        }));
      },

      getActivePreparations: () => {
        const state = get();
        return state.preparations.filter((p) => Date.now() <= p.expiresAt);
      },
    }),
    {
      name: "tredro-preparation",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
