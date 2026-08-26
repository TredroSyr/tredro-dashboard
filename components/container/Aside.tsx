"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { AsideProps } from "./types";

export function Aside({ children, className }: AsideProps) {
  return (
    <aside
      data-slot="container-aside"
      className={cn("sticky top-0 z-10  self-start ms-auto", className)}
    >
      {children}
    </aside>
  );
}
