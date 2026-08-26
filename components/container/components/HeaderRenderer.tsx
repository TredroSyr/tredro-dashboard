"use client";

import { IconRenderer } from "@/assets/icons/iconRenderer";
import { cn } from "@/lib/utils";
import * as React from "react";
import type { SlotData } from "../types";

interface HeaderRendererProps {
  hasHeaderList: boolean;
  shouldBeFullSize: boolean;
  hasTitleOrDescription: boolean;
  hasBreadcrumb: boolean;
  hasActions: boolean;
  hasToggle: boolean;
  titleSlot: SlotData | null;
  descriptionSlot: SlotData | null;
  breadcrumbSlot: SlotData | null;
  actionsSlots: SlotData[];
  toggleSlot: SlotData | null;
}

/**
 * CurveIcon - Reusable curve icon component for header decoration
 */
export const CurveIcon = React.memo(() => (
  <IconRenderer
    name="curve"
    className="absolute bottom-0 start-full size-5 fill-bg-primary scale-x-[-1] rtl:scale-x-[1]"
  />
));
CurveIcon.displayName = "CurveIcon";

/**
 * ActionsRenderer - Renders action slots
 * Automatically hides if there's no visible content (e.g., when PermissionGate hides all buttons)
 */
const ActionsRenderer = React.memo(
  ({ actionsSlots }: { actionsSlots: SlotData[] }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [hasContent, setHasContent] = React.useState(true);

    React.useLayoutEffect(() => {
      if (containerRef.current) {
        // Check if the container has any actual rendered content
        // This handles cases where PermissionGate hides all buttons or components return null/empty
        const children = Array.from(containerRef.current.children);
        const hasVisibleContent =
          children.length > 0 &&
          children.some((child) => {
            // Check if child has visible content (either has children or has text content)
            const hasChildren = child.children.length > 0;
            const hasText =
              child.textContent && child.textContent.trim().length > 0;
            // Check if element is not hidden (display: none, visibility: hidden, etc.)
            const style = window.getComputedStyle(child);
            const isVisible =
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              style.opacity !== "0";
            return (hasChildren || hasText) && isVisible;
          });
        setHasContent(hasVisibleContent);
      }
    });

    if (!hasContent) {
      return null;
    }

    return (
      <div
        ref={containerRef}
        data-slot="container-header-actions"
        className="flex items-center justify-end gap-2 sm:gap-3 px-2 sm:px-3 py-1"
      >
        {actionsSlots.map((slot) => (
          <React.Fragment key={slot.key}>{slot.content}</React.Fragment>
        ))}
      </div>
    );
  },
);
ActionsRenderer.displayName = "ActionsRenderer";

/**
 * HeaderRenderer - Renders the container header section
 * Handles two cases:
 * 1. When title/description exists (full header with title/description area)
 * 2. When only breadcrumb/actions/toggle exists (compact header)
 */
export function HeaderRenderer({
  hasHeaderList,
  shouldBeFullSize,
  hasTitleOrDescription,
  hasBreadcrumb,
  hasActions,
  hasToggle,
  titleSlot,
  descriptionSlot,
  breadcrumbSlot,
  actionsSlots,
  toggleSlot,
}: HeaderRendererProps) {
  // Case 1: Header with title/description
  if (hasTitleOrDescription) {
    return (
      <>
        <div
          data-slot="container-header-body"
          className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-2 sm:gap-3"
        >
          <div
            className={cn(
              "flex-1 flex px-3 sm:px-6 min-h-14 h-auto w-full rounded-t-2xl transition-all relative bg-primary/4",
              !hasHeaderList && "rounded-tl-2xl",
            )}
          >
            <div className="flex w-full items-start justify-between gap-4 flex-wrap">
              <div className="flex flex-col gap-1 min-w-0 py-3">
                {titleSlot && titleSlot.content}
                {descriptionSlot && descriptionSlot.content}
              </div>
              {hasToggle && (
                <div className="shrink-0 self-center">
                  {toggleSlot?.content}
                </div>
              )}
            </div>
            {!shouldBeFullSize && <CurveIcon />}
          </div>
          {hasActions && <ActionsRenderer actionsSlots={actionsSlots} />}
        </div>

        {hasBreadcrumb && (
          <div
            className={cn(
              "px-3 sm:px-6 bg-primary/4 pt-3 sm:pt-4",
              !hasHeaderList && "rounded-tl-2xl",
            )}
          >
            {breadcrumbSlot?.content}
          </div>
        )}
      </>
    );
  }

  // Case 2: Compact header (only breadcrumb/actions/toggle, no title/description)
  if (hasBreadcrumb || hasActions || hasToggle) {
    return (
      <div
        data-slot="container-header-body"
        className="flex items-center min-h-14 h-auto justify-between gap-2 sm:gap-3"
      >
        <div
          className={cn(
            "flex-1 flex bg-primary/4 items-center px-3 sm:px-6 w-full rounded-t-2xl h-full min-h-14 transition-all relative",
            !hasHeaderList && "rounded-tl-2xl",
          )}
        >
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex-1 min-w-0 flex items-center">
              {breadcrumbSlot?.content}
            </div>
            {hasToggle && <div className="shrink-0">{toggleSlot?.content}</div>}
          </div>
          {!shouldBeFullSize && <CurveIcon />}
        </div>
        {hasActions && <ActionsRenderer actionsSlots={actionsSlots} />}
      </div>
    );
  }

  return null;
}
