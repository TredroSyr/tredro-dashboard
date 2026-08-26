"use client";

import { cn } from "@/lib/utils";
import type { ContentProps } from "./types";
import { SlotComponent } from "./SlotComponent";
import { useContentHeightStyle } from "./hooks/useContentHeightStyle";

export function Content({
  children,
  className,
  noScroll = false,
}: ContentProps) {
  const heightStyle = useContentHeightStyle();

  return (
    <SlotComponent
      slotType="content"
      className={cn(className, "min-h-[100vh]")}
    >
      {children}
    </SlotComponent>
  );
}
