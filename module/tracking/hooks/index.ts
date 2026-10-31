"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/module/auth/store/auth-store";
import { useCustomersQuery } from "@/module/customers/hooks";
import type { DayCustomer } from "../lib/dummy-day";
import { getGovernorateCenter } from "../lib/geo";
import { fetchRoadLegs, stopsKey } from "../lib/roads";
import type { LatLng } from "../types";

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

/**
 * The rep's real customers (id + name), so the day's shops link to real
 * customer pages. `undefined` while loading.
 */
export function useRepCustomers(repId: string): DayCustomer[] | undefined {
  const { data, isLoading } = useCustomersQuery(repId);
  const list = data?.data?.customers;
  return useMemo(
    () => (isLoading ? undefined : (list ?? []).filter((c) => c.is_active).map((c) => ({ id: c.id, name: c.name }))),
    [isLoading, list],
  );
}

/** Every rep's customers, from one list request, keyed by rep id. */
export function useCustomersByRep(): Record<string, DayCustomer[]> | undefined {
  const { data, isLoading } = useCustomersQuery();
  const list = data?.data?.customers;
  return useMemo(() => {
    if (isLoading) return undefined;
    const byRep: Record<string, DayCustomer[]> = {};
    (list ?? [])
      .filter((c) => c.is_active)
      .forEach((c) =>
        c.assigned_reps_details?.forEach((rep) => {
          (byRep[String(rep.id)] ??= []).push({ id: c.id, name: c.name });
        }),
      );
    return byRep;
  }, [isLoading, list]);
}

const roadQuery = (stops: LatLng[] | null) => ({
  queryKey: ["tracking", "road-legs", stops ? stopsKey(stops) : null],
  queryFn: ({ signal }: { signal: AbortSignal }) => fetchRoadLegs(stops!, signal),
  enabled: !!stops && stops.length > 1,
  staleTime: Infinity,
  gcTime: Infinity,
  retry: 1,
});

/** Street geometry for one day's legs; null until loaded (or if routing fails — legs stay rough). */
export function useRoadLegs(stops: LatLng[] | null) {
  const { data } = useQuery(roadQuery(stops));
  return data ?? null;
}

/** Same as useRoadLegs for many reps at once, in the given order. */
export function useRoadLegsMany(stopsList: (LatLng[] | null)[]) {
  const results = useQueries({ queries: stopsList.map(roadQuery) });
  return results.map((r) => r.data ?? null);
}
