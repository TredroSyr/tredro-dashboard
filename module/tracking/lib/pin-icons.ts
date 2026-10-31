import type { RepActivityType } from "../types";

/** Tiny inline SVGs for the map pin badges (Leaflet markers are plain HTML). */
const svg = (body: string) =>
  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const PIN_ICONS = {
  receipt: svg(
    `<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>`,
  ),
  wallet: svg(
    `<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>`,
  ),
  undo: svg(`<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>`),
  ban: svg(`<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>`),
  userPlus: svg(
    `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>`,
  ),
  clock: svg(`<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>`),
  check: svg(`<path d="M20 6 9 17l-5-5"/>`),
  flag: svg(`<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>`),
};

export const ACTIVITY_PIN_ICON: Record<RepActivityType, string> = {
  day_start: PIN_ICONS.flag,
  invoice: PIN_ICONS.receipt,
  collection: PIN_ICONS.wallet,
  return: PIN_ICONS.undo,
  new_customer: PIN_ICONS.userPlus,
  no_sale: PIN_ICONS.ban,
  day_end: PIN_ICONS.flag,
};

/** Badge/text tints; the variables switch with light/dark (see .tk-frame in globals.css). */
export const ACTIVITY_TONE: Partial<Record<RepActivityType, string>> = {
  return: "var(--tk-red)",
  no_sale: "var(--tk-amber)",
  new_customer: "var(--tk-violet)",
};
