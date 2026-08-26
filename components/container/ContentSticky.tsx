"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { ContentStickyProps } from "./types";

export function ContentSticky({ children, className }: ContentStickyProps) {
  return (
    <div className={cn("sticky lg-top-0 top-9 z-10 bg-card", className)}>
      {children}
    </div>
  );
}
