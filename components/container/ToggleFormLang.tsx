"use client";

import * as React from "react";
import { SlotComponent } from "./SlotComponent";

/**
 * ToggleFormLangSlot - Wrapper for ToggleFormLang component
 * Allows ToggleFormLang to be used as a slot in NewContainer
 */
type ToggleFormLangSlotProps = React.ComponentProps<typeof ToggleFormLang>;

export function ToggleFormLangSlot(props: ToggleFormLangSlotProps) {
  return <SlotComponent slotType="toggleFormLang">TEST</SlotComponent>;
}
