"use client";

import * as React from "react";
import type { SlotComponentProps } from "./types";
import { useContainerContext } from "./context";

export function SlotComponent({
  children,
  slotType,
  className,
  style,
  slotKey,
  hide,
}: SlotComponentProps) {
  const { registerSlot, unregisterSlot } = useContainerContext();
  // Initialize keyRef with slotKey if provided, otherwise generate random key
  const keyRef = React.useRef<string>(
    slotKey || `slot-${slotType}-${Math.random().toString(36).substr(2, 9)}`,
  );
  const hideKeyRef = React.useRef<string | null>(null); // Stable key for hide slots
  const childrenRef = React.useRef(children);
  const classNameRef = React.useRef(className);
  const styleRef = React.useRef(style);
  const renderContentRef = React.useRef<(() => React.ReactNode) | undefined>(
    undefined,
  );
  const prevClassNameRef = React.useRef(className);
  const prevStyleRef = React.useRef(style);
  const hideRef = React.useRef(hide);
  const forceUpdateRef = React.useRef(0);

  // Update keyRef immediately if slotKey prop changes
  if (slotKey && keyRef.current !== slotKey) {
    keyRef.current = slotKey;
  }

  // Update refs on every render to capture latest values
  childrenRef.current = children;
  classNameRef.current = className;
  styleRef.current = style;
  hideRef.current = hide;

  // Update renderContentRef for content slots - this will always use latest refs
  if (slotType === "content") {
    renderContentRef.current = () => (
      <div className={classNameRef.current} style={styleRef.current}>
        {childrenRef.current}
      </div>
    );
  }

  // Check if className or style changed (children is always new, so we can't compare it)
  const classNameChanged = prevClassNameRef.current !== className;
  const styleChanged = prevStyleRef.current !== style;
  if (classNameChanged) {
    prevClassNameRef.current = className;
    forceUpdateRef.current += 1;
  }
  if (styleChanged) {
    prevStyleRef.current = style;
    forceUpdateRef.current += 1;
  }

  // Always increment force update to ensure content updates (children is always new)
  // This ensures loading states and form validation errors update properly
  forceUpdateRef.current += 1;

  // Register/unregister slot when slotType, slotKey, or hide changes
  React.useEffect(() => {
    // Use slotKey if provided, otherwise use keyRef.current
    // Update keyRef to match slotKey for consistency
    const key = slotKey || keyRef.current;
    if (slotKey) {
      keyRef.current = slotKey;
    }

    // If hide is true, register with null content using a unique key
    // This allows the layout's slot to remain registered
    if (hideRef.current) {
      // Generate hide key only once and reuse it
      if (!hideKeyRef.current) {
        hideKeyRef.current = `${key}-hide-${Math.random().toString(36).substr(2, 9)}`;
      }
      const hideKey = hideKeyRef.current;
      registerSlot({
        type: slotType,
        content: null,
        key: hideKey,
        // Store the original key for filtering
        originalKey: key,
        renderContent: undefined,
      });
      return () => {
        unregisterSlot(hideKey);
        hideKeyRef.current = null; // Reset hide key when unmounting
      };
    } else {
      // Reset hide key when hide becomes false
      if (hideKeyRef.current) {
        unregisterSlot(hideKeyRef.current);
        hideKeyRef.current = null;
      }
      // Ensure keyRef is set to the original slotKey when not hiding
      if (slotKey) {
        keyRef.current = slotKey;
      }
    }

    // For content slots, we use renderContent which reads from refs
    if (slotType === "content") {
      renderContentRef.current = () => (
        <div className={classNameRef.current} style={styleRef.current}>
          {childrenRef.current}
        </div>
      );
    }

    // Create initial content (for non-content slots or fallback)
    // Use the original key, not a hide key
    const normalKey = slotKey || keyRef.current;
    const content = (
      <div className={classNameRef.current} style={styleRef.current}>
        {childrenRef.current}
      </div>
    );

    registerSlot({
      type: slotType,
      content,
      key: normalKey,
      renderContent: renderContentRef.current,
    });

    return () => unregisterSlot(normalKey);
  }, [slotType, slotKey, hide, registerSlot, unregisterSlot]);

  // Update slot content when it changes
  // Use useLayoutEffect to update synchronously before paint
  // We need to update on every render because children is always a new object
  // but we use refs to avoid dependency issues
  React.useLayoutEffect(() => {
    // Use slotKey if provided, otherwise use keyRef.current
    const originalKey = slotKey || keyRef.current;

    // If hide is true, use the stable hide key
    if (hideRef.current) {
      if (!hideKeyRef.current) {
        hideKeyRef.current = `${originalKey}-hide-${Math.random().toString(36).substr(2, 9)}`;
      }
      const hideKey = hideKeyRef.current;

      registerSlot({
        type: slotType,
        content: null,
        key: hideKey,
        originalKey: originalKey,
        renderContent: undefined,
      });
      // No cleanup here - cleanup is handled by useEffect
      return;
    }

    // For normal slots, update keyRef if slotKey is provided
    if (slotKey) {
      keyRef.current = slotKey;
    }
    const key = slotKey || keyRef.current;

    // Update renderContentRef for content slots
    if (slotType === "content") {
      renderContentRef.current = () => (
        <div className={classNameRef.current} style={styleRef.current}>
          {childrenRef.current}
        </div>
      );
    }

    // Create updated content with latest values from refs
    const content = (
      <div className={classNameRef.current} style={styleRef.current}>
        {childrenRef.current}
      </div>
    );

    // Re-register slot with updated content
    registerSlot({
      type: slotType,
      content,
      key,
      renderContent: renderContentRef.current,
    });
  });

  return null;
}
