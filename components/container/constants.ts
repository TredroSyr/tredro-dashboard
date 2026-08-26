/**
 * Constants for Container system
 */

import type { CSSProperties } from "react";

/**
 * Height of the container header in pixels
 * Used for calculating minimum content height
 */
export const CONTAINER_HEADER_HEIGHT = 170;

/**
 * Optional header slot heights for Container.Content.
 * Added on top of CONTENT_BASE_OFFSET when present.
 * All four present → 178 + 64 + 34 = 276px total offset.
 */
export const CONTENT_HEADER_HEIGHT = {
  TITLE_DESCRIPTION_ACTIONS_ROW: 64,
  BREADCRUMB_ALONE: 64,
  BREADCRUMB_WITH_HEADER_ROW: 34,
  SUBSCRIPTION_BANNER: 56,
} as const;

/** Expert/super-admin top navbar height (`Navbar` uses `min-h-[96px]`) */
export const PAGE_NAVBAR_HEIGHT = 96;

/** Breathing room at the bottom of scrollable content */
export const CONTENT_BOTTOM_GAP = 40;

/** Bottom gap when the page navbar is absent (e.g. settings layout) */
export const NO_PAGE_NAVBAR_BOTTOM_GAP = CONTENT_BOTTOM_GAP;

/** Fixed chrome when no title, description, actions, or breadcrumb */
export const CONTENT_BASE_OFFSET =
  276 -
  CONTENT_HEADER_HEIGHT.TITLE_DESCRIPTION_ACTIONS_ROW -
  CONTENT_HEADER_HEIGHT.BREADCRUMB_WITH_HEADER_ROW;

export interface ContentHeaderSlots {
  hasTitle: boolean;
  hasDescription: boolean;
  hasActions: boolean;
  hasBreadcrumb: boolean;
}

export function getOptionalHeaderHeight(slots: ContentHeaderSlots): number {
  const hasHeaderRow =
    slots.hasTitle || slots.hasDescription || slots.hasActions;
  let height = 0;

  if (hasHeaderRow) {
    height += CONTENT_HEADER_HEIGHT.TITLE_DESCRIPTION_ACTIONS_ROW;
  }

  if (slots.hasBreadcrumb) {
    height += hasHeaderRow
      ? CONTENT_HEADER_HEIGHT.BREADCRUMB_WITH_HEADER_ROW
      : CONTENT_HEADER_HEIGHT.BREADCRUMB_ALONE;
  }

  return height;
}

export interface ContentHeightOptions {
  hasSubscriptionBanner?: boolean;
  /** When false (e.g. settings layout), the expert navbar is absent and content gains that height */
  hasPageNavbar?: boolean;
}

function shouldApplyContentBottomGap(slots: ContentHeaderSlots): boolean {
  const hasTitleOrDescription = slots.hasTitle || slots.hasDescription;

  if (hasTitleOrDescription && slots.hasActions) {
    return true;
  }

  if (slots.hasBreadcrumb && !hasTitleOrDescription && !slots.hasActions) {
    return true;
  }

  // HeaderList-only pages (e.g. coaching overview) — no title, description, actions, or breadcrumb
  return !hasTitleOrDescription && !slots.hasActions && !slots.hasBreadcrumb;
}

export function getContentViewportOffset(
  slots: ContentHeaderSlots,
  options?: ContentHeightOptions,
): number {
  let offset = CONTENT_BASE_OFFSET + getOptionalHeaderHeight(slots);

  if (options?.hasSubscriptionBanner) {
    offset += CONTENT_HEADER_HEIGHT.SUBSCRIPTION_BANNER;
  }

  if (options?.hasPageNavbar === false) {
    offset -= PAGE_NAVBAR_HEIGHT - NO_PAGE_NAVBAR_BOTTOM_GAP;
  }

  // Add a small bottom gap so content does not sit flush against the viewport edge.
  if (shouldApplyContentBottomGap(slots)) {
    offset += CONTENT_BOTTOM_GAP;
  }

  return offset;
}

// export function getContentHeightStyle(
//   slots: ContentHeaderSlots,
//   options?: ContentHeightOptions,
// ): CSSProperties {
//   return {
//     height: `calc(100vh - ${getContentViewportOffset(slots, options)}px)`,
//   };
// }
export function getContentHeightStyle(
  slots: ContentHeaderSlots,
  options?: ContentHeightOptions,
): CSSProperties {
  return {
    height: `calc(100vh)`,
  };
}
