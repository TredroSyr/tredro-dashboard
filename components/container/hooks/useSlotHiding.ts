"use client";

import * as React from "react";
import { useContainerContext } from "../context";
import type { SlotType } from "../types";

/**
 * Hook to handle slot hiding pattern
 * When hide is true, registers a slot with null content to override any existing slot
 * This allows components to hide themselves even if other instances exist
 *
 * @param slotType - The type of slot to hide
 * @param hide - Whether to hide the slot
 * @returns A ref to the slot key (for use in the component)
 */
export function useSlotHiding(slotType: SlotType, hide: boolean) {
  const { registerSlot, unregisterSlot } = useContainerContext();
  const keyRef = React.useRef<string>(
    `${slotType}-hide-${Math.random().toString(36).substr(2, 9)}`,
  );

  React.useEffect(() => {
    if (hide) {
      const key = keyRef.current;
      registerSlot({
        type: slotType,
        content: null,
        key,
      });
      return () => {
        unregisterSlot(key);
      };
    }
  }, [hide, slotType, registerSlot, unregisterSlot]);

  return keyRef;
}
