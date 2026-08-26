"use client";

import type { CSSProperties } from "react";

import { getContentHeightStyle } from "../constants";
import { useContainerContext } from "../context";

export function useContentHeightStyle(): CSSProperties {
  const { headerSlots, hasPageNavbar } = useContainerContext();

  return getContentHeightStyle(headerSlots, {
    hasPageNavbar,
  });
}
