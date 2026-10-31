"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/module/auth/store/auth-store";
import { getGovernorateCenter } from "../lib/geo";

/** Current time, re-read every `intervalMs` so "live" views move on their own. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** The company's city center — dummy tracks are generated around it. */
export function useTrackingCenter() {
  const governorate = useAuthStore((state) => state.user?.company?.governorate);
  return getGovernorateCenter(governorate);
}

export function useCompanyCurrency() {
  return useAuthStore((state) => state.user?.company?.currency) ?? "SYP";
}
