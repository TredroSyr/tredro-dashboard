"use client";

import * as React from "react";
import { SlotComponent } from "./SlotComponent";
import { ActionsProps } from "./types";

/**
 * ContentDetector - Wrapper that detects if children render visible content
 * This is used to automatically hide Actions when children render empty content
 */
function ContentDetector({
  children,
  onEmpty,
}: {
  children: React.ReactNode;
  onEmpty: () => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (!containerRef.current) return;

    const children = Array.from(containerRef.current.children);
    const hasVisibleContent =
      children.length > 0 &&
      children.some((child) => {
        const hasChildren = child.children.length > 0;
        const hasText =
          child.textContent && child.textContent.trim().length > 0;
        const style = window.getComputedStyle(child);
        const isVisible =
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0";
        return (hasChildren || hasText) && isVisible;
      });

    if (!hasVisibleContent) {
      onEmpty();
    }
  });

  return (
    <div ref={containerRef} style={{ display: "contents" }}>
      {children}
    </div>
  );
}

/**
 * Actions - Action buttons container component
 * Typically contains save, cancel, or other action buttons
 *
 * @param actionKey - Optional key to identify this actions slot.
 *                    If multiple Actions components share the same key, they will be grouped together.
 * @param hide - If true, hides the Actions component with the same actionKey (typically used in child pages to hide layout actions).
 *               When hide is true, children are ignored.
 *               Also automatically hides if children is null, undefined, empty array, or renders no visible content.
 */
export function Actions({
  children,
  className,
  actionKey,
  hide,
}: ActionsProps) {
  const [autoHide, setAutoHide] = React.useState(false);

  // Check if children is null, undefined, or empty before render
  const hasInitialContent = React.useMemo(() => {
    if (hide) return false;
    if (children === null || children === undefined) return false;

    if (Array.isArray(children)) {
      const validChildren = children.filter(
        (child) => child !== null && child !== undefined && child !== false,
      );
      return validChildren.length > 0;
    }

    // For React elements, we'll check after render
    return true;
  }, [children, hide]);

  // Reset autoHide when children changes
  React.useEffect(() => {
    setAutoHide(false);
  }, [children]);

  // If hide is true, no initial content, or autoHide is true, hide the slot
  const shouldHide = hide || !hasInitialContent || autoHide;

  return (
    <SlotComponent
      slotType="actions"
      className={className}
      slotKey={actionKey}
      hide={shouldHide}
    >
      {shouldHide ? null : (
        <ContentDetector onEmpty={() => setAutoHide(true)}>
          {children}
        </ContentDetector>
      )}
    </SlotComponent>
  );
}
