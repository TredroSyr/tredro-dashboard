"use client";

import * as React from "react";
import type { DescriptionProps } from "./types";
import { SlotComponent } from "./SlotComponent";

/**
 * Description - Page description component
 * Renders as a paragraph with secondary text styling
 */
export function Description({ children, className }: DescriptionProps) {
  return (
    <SlotComponent slotType="description" className={className}>
      <p className="text-gray-400 text-xs font-normal">{children}</p>
    </SlotComponent>
  );
}
