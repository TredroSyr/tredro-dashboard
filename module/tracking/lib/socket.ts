/**
 * One shared WebSocket for live tracking (docs/rep-tracking-api.md §5).
 *
 * Views `retain` a scope ("all" or a rep id) while mounted; the socket opens
 * with the first one and closes after the last. Events patch the react-query
 * cache in place — the same raw shapes the REST reads return — so every view
 * reading those queries moves on its own. After every (re)connect the tracking
 * queries are re-read, since the server replays nothing.
 */
import type { QueryClient } from "@tanstack/react-query";
import { refreshAccessToken } from "@/module/auth/lib/auth";
import { useAuthStore } from "@/module/auth/store/auth-store";
import type { ApiActivity, ApiLiveRep, ApiPosition, ApiRepDay, ApiStats } from "../api";
import type { RepLiveStatus } from "../types";
import { parseTime } from "./day";

export type SocketState = "idle" | "connecting" | "open" | "closed" | "denied";

type TrackingEvent =
  | { type: "location"; rep_id: number; at: string; point: ApiPosition }
  | { type: "activity"; rep_id: number; at: string; activity: ApiActivity }
  | { type: "stats"; rep_id: number; at: string; stats: ApiStats }
  | { type: "status"; rep_id: number; at: string; status: RepLiveStatus; current_customer: { id: number; name: string } | null };

export const trackingKeys = {
  all: ["tracking"] as const,
  live: ["tracking", "live"] as const,
  day: (repId: string, date: string) => ["tracking", "day", repId, date] as const,
};

/** wss://api.tredro.online/ws/companies/tracking/ from the REST base URL (…/api). */
function socketUrl(token: string) {
  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "").replace(/\/api$/, "");
  return `${base.replace(/^http/, "ws")}/ws/companies/tracking/?token=${encodeURIComponent(token)}`;
}

const scopeMessage = (action: "subscribe" | "unsubscribe", key: string) =>
  JSON.stringify(key === "all" ? { action, scope: "all" } : { action, scope: "rep", rep_id: Number(key) });

class TrackingSocket {
  private ws: WebSocket | null = null;
  private scopes = new Map<string, number>();
  private queryClient: QueryClient | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private attempts = 0;
  private triedRefresh = false;
  private stateListeners = new Set<() => void>();
  state: SocketState = "idle";

  attach(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  subscribeState = (listener: () => void) => {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  };

  getState = () => this.state;

  private setState(state: SocketState) {
    this.state = state;
    this.stateListeners.forEach((l) => l());
  }

  /** Follow a scope while the caller is mounted; returns the release function. */
  retain(key: string) {
    const count = this.scopes.get(key) ?? 0;
    this.scopes.set(key, count + 1);
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.closeTimer = null;
    if (count === 0 && this.ws?.readyState === WebSocket.OPEN) this.ws.send(scopeMessage("subscribe", key));
    if (!this.ws && this.state !== "denied") this.connect();

    return () => {
      const left = (this.scopes.get(key) ?? 1) - 1;
      if (left > 0) {
        this.scopes.set(key, left);
        return;
      }
      this.scopes.delete(key);
      if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(scopeMessage("unsubscribe", key));
      // Navigating between tracking views releases and retains in one go; don't drop the socket for that.
      if (!this.scopes.size) this.closeTimer = setTimeout(() => this.disconnect(), 5_000);
    };
  }

  private connect() {
    const token = useAuthStore.getState().accessToken;
    if (!token || typeof WebSocket === "undefined") return;
    this.setState("connecting");
    const ws = new WebSocket(socketUrl(token));
    this.ws = ws;

    ws.onopen = () => {
      this.scopes.forEach((_, key) => ws.send(scopeMessage("subscribe", key)));
    };

    ws.onmessage = (e) => {
      let msg: { type?: string } & Record<string, unknown>;
      try {
        msg = JSON.parse(String(e.data));
      } catch {
        return;
      }
      if (msg.type === "ping") {
        ws.send(JSON.stringify({ action: "pong" }));
        return;
      }
      if (msg.type === "subscribed") {
        // First reply after (re)connecting: the socket is really usable now.
        if (this.state !== "open") {
          this.attempts = 0;
          this.triedRefresh = false;
          this.setState("open");
          // Nothing is replayed on reconnect — re-read whatever is on screen.
          this.queryClient?.invalidateQueries({ queryKey: trackingKeys.all });
        }
        return;
      }
      if (msg.type === "location" || msg.type === "activity" || msg.type === "stats" || msg.type === "status") {
        this.apply(msg as unknown as TrackingEvent);
      }
    };

    ws.onclose = async (e) => {
      if (this.ws !== ws) return;
      this.ws = null;
      if (e.code === 4403) {
        this.setState("denied");
        return;
      }
      this.setState("closed");
      if (!this.scopes.size) return;
      if (e.code === 4401 && !this.triedRefresh) {
        this.triedRefresh = true;
        const result = await refreshAccessToken().catch(() => null);
        if (result?.ok && this.scopes.size && !this.ws) this.connect();
        return;
      }
      const delay = Math.min(30_000, 1_000 * 2 ** this.attempts++);
      this.retryTimer = setTimeout(() => {
        if (this.scopes.size && !this.ws) this.connect();
      }, delay);
    };
  }

  private disconnect() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    const ws = this.ws;
    this.ws = null;
    ws?.close();
    if (this.state !== "denied") this.setState("idle");
  }

  private apply(event: TrackingEvent) {
    const qc = this.queryClient;
    if (!qc) return;
    const repId = String(event.rep_id);
    // Events are always about "today" in Syria time; `at` carries the +03:00 offset.
    const dayKey = trackingKeys.day(repId, event.at.slice(0, 10));

    qc.setQueryData<ApiRepDay>(dayKey, (day) => (day ? patchDay(day, event) : day));
    qc.setQueryData<ApiLiveRep[]>(trackingKeys.live, (reps) =>
      reps?.map((rep) => (rep.rep_id === event.rep_id ? patchLive(rep, event) : rep)),
    );

    // A day that ended on its own gets its inferred end on the next read.
    if (event.type === "status" && event.status === "finished") {
      qc.invalidateQueries({ queryKey: dayKey });
      qc.invalidateQueries({ queryKey: trackingKeys.live });
    }
  }
}

function insertActivity(list: ApiActivity[], activity: ApiActivity) {
  // Events can arrive twice; the id is stable.
  const rest = list.filter((a) => a.id !== activity.id);
  return [...rest, activity].sort((a, b) => parseTime(a.at) - parseTime(b.at));
}

function patchCommon<T extends ApiRepDay | ApiLiveRep>(day: T, event: TrackingEvent): T {
  switch (event.type) {
    case "activity": {
      const a = event.activity;
      const next = { ...day, activities: insertActivity(day.activities, a) };
      if (a.type === "day_start") {
        next.day_start = a.at;
        next.day_end = null;
        if (a.latitude != null && a.longitude != null) next.depot = { latitude: a.latitude, longitude: a.longitude };
      }
      if (a.type === "day_end") next.day_end = a.at;
      return next;
    }
    case "stats":
      return { ...day, stats: event.stats };
    case "status":
      return { ...day, status: event.status, current_customer: event.current_customer };
    default:
      return day;
  }
}

function patchDay(day: ApiRepDay, event: TrackingEvent): ApiRepDay {
  if (event.type === "location") {
    const { point } = event;
    const last = day.path[day.path.length - 1];
    if (last && parseTime(last.recorded_at) >= parseTime(point.recorded_at)) return day;
    return { ...day, position: point, path: [...day.path, point] };
  }
  const next = patchCommon(day, event);
  if (event.type === "activity" && event.activity.customer) {
    const c = event.activity.customer;
    const known = next.planned.some((p) => p.id === c.id);
    // Visited first, in visit order; an off-plan shop joins the list.
    const visited = next.planned.filter((p) => p.visited || p.id === c.id).map((p) => ({ ...p, visited: true }));
    const pending = next.planned.filter((p) => !p.visited && p.id !== c.id);
    if (!known) {
      visited.push({ id: c.id, name: c.name, latitude: event.activity.latitude, longitude: event.activity.longitude, visited: true });
    }
    next.planned = [...visited, ...pending];
  }
  return next;
}

function patchLive(rep: ApiLiveRep, event: TrackingEvent): ApiLiveRep {
  if (event.type === "location") {
    const { point } = event;
    const last = rep.path_preview[rep.path_preview.length - 1];
    if (last && parseTime(last.recorded_at) >= parseTime(point.recorded_at)) return rep;
    return { ...rep, position: point, path_preview: [...rep.path_preview, point] };
  }
  const next = patchCommon(rep, event);
  if (event.type === "activity") next.last_activity = next.activities[next.activities.length - 1] ?? null;
  return next;
}

export const trackingSocket = new TrackingSocket();
