"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/module/auth/store/auth-store";
import { getRepDay, getRepsLive } from "../api";
import { adaptDay, emptyDay } from "../lib/day";
import { getGovernorateCenter } from "../lib/geo";
import { trackingKeys, trackingSocket } from "../lib/socket";
import type { RepDaySnapshot } from "../types";

/** Current time, re-read every `intervalMs` so "live" views move on their own. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** The company's city center — where the map opens before there's anything to fit. */
export function useTrackingCenter() {
  const governorate = useAuthStore((state) => state.user?.company?.governorate);
  return getGovernorateCenter(governorate);
}

export function useCompanyCurrency() {
  return useAuthStore((state) => state.user?.company?.currency) ?? "SYP";
}

/**
 * Keeps the shared tracking socket following `scope` ("all", or a rep id)
 * while mounted. Returns whether live updates are flowing; when they aren't,
 * callers fall back to polling.
 */
export function useTrackingSocket(scope: "all" | string | null) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!scope) return;
    trackingSocket.attach(queryClient);
    return trackingSocket.retain(scope);
  }, [scope, queryClient]);
  const state = useSyncExternalStore(trackingSocket.subscribeState, trackingSocket.getState, () => "idle" as const);
  return state === "open";
}

/** If the socket can't connect, the doc asks for a 30 s poll instead. */
const POLL_MS = 30_000;

/** Every rep of the company, today, kept live over the socket. */
export function useRepsLiveQuery() {
  const live = useTrackingSocket("all");
  const query = useQuery({
    queryKey: trackingKeys.live,
    queryFn: getRepsLive,
    refetchInterval: live ? false : POLL_MS,
  });
  const rows = useMemo(
    () => (query.data ?? []).map((rep) => ({ id: String(rep.rep_id), name: rep.name, day: adaptDay(rep) })),
    [query.data],
  );
  return { rows, isLoading: query.isLoading, isError: query.isError };
}

/**
 * One rep's day. Today is followed live over the socket; past days are read
 * once and kept, they don't change. `date` is a Syria-time YYYY-MM-DD.
 */
export function useRepDayQuery(repId: string | null, date: string, today: string) {
  const isToday = date === today;
  const live = useTrackingSocket(repId && isToday ? repId : null);
  const query = useQuery({
    queryKey: trackingKeys.day(repId ?? "", date),
    queryFn: () => getRepDay(repId!, date),
    enabled: !!repId && date <= today,
    staleTime: isToday ? 0 : 5 * 60_000,
    refetchInterval: isToday && !live ? POLL_MS : false,
  });
  const day: RepDaySnapshot = useMemo(
    () => (query.data ? adaptDay(query.data) : emptyDay(repId ?? "", date)),
    [query.data, repId, date],
  );
  return { day, isLoading: query.isLoading, isError: query.isError };
}
