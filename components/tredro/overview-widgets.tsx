"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { iconName } from "@/assets/icons/iconRenderer/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Horizontal drag-to-scroll for a row that also scrolls natively (touch/wheel).
 * Shared by every overview screen's KPI row and activity section.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [dragging, setDragging] = useState(false);
  const state = useRef({ startX: 0, startLeft: 0 });

  const onPointerDown = (e: PointerEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    setDragging(true);
    state.current.startX = e.clientX;
    state.current.startLeft = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<T>) => {
    if (!dragging) return;
    const el = ref.current;
    if (!el) return;
    el.scrollLeft = state.current.startLeft - (e.clientX - state.current.startX);
  };
  const endDrag = (e: PointerEvent<T>) => {
    if (!dragging) return;
    setDragging(false);
    ref.current?.releasePointerCapture(e.pointerId);
  };

  return {
    ref,
    dragging,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}

// ---- KPI row ----

export interface OverviewStatCardProps {
  icon: iconName;
  label: string;
  value: string | number;
  suffix?: string;
  /** Omit (or null) for a figure with no honest "previous" reading, e.g. a queue — no arrow is drawn. */
  change?: number | null;
}

export function OverviewStatCard({
  icon,
  label,
  value,
  suffix,
  change,
}: OverviewStatCardProps) {
  const hasChange = change != null;
  const isUp = (change ?? 0) >= 0;
  return (
    <div className="shrink-0 w-[150px] sm:w-auto rounded-2xl border border-border bg-card p-3.5 sm:p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <IconRenderer name={icon} className="size-4" />
        </div>
        {hasChange && (
          <span
            className={cn(
              "text-[11px] font-medium flex items-center gap-0.5",
              isUp ? "text-emerald-600" : "text-red-500",
            )}
          >
            <IconRenderer
              name={isUp ? "arrow_up_outlined" : "arrow_down_outlined"}
              className="size-3"
            />
            {Math.abs(change as number)}%
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1 flex-wrap">
        <span className="text-xl sm:text-2xl font-semibold text-foreground break-all">
          {value}
        </span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
      <span className="text-xs text-muted-foreground truncate">{label}</span>
    </div>
  );
}

export function OverviewStatCardSkeleton() {
  return (
    <div className="shrink-0 w-[150px] sm:w-auto rounded-2xl border border-border bg-card p-3.5 sm:p-4 flex flex-col gap-2 min-w-0">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function OverviewStatCardRow({ children }: { children: ReactNode }) {
  const { ref, dragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
    useDragScroll<HTMLDivElement>();
  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className={cn(
        "flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible",
        dragging ? "cursor-grabbing select-none" : "cursor-grab sm:cursor-auto",
      )}
    >
      {children}
    </div>
  );
}

// ---- Status distribution chart ----

export interface OverviewDistributionBar {
  key: string;
  label: string;
  value: number;
  /** Visually separates a bar that overlaps the others (e.g. "overdue" over "deferred") instead of partitioning the total. */
  muted?: boolean;
}

export interface OverviewDistributionChartProps {
  title: string;
  total: number;
  totalSuffix?: string;
  bars: OverviewDistributionBar[];
}

export function OverviewDistributionChart({
  title,
  total,
  totalSuffix,
  bars,
}: OverviewDistributionChartProps) {
  const [sel, setSel] = useState(0);
  const maxV = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col h-full">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <IconRenderer
          name="arrow_up_right_outlined"
          className="size-4 text-muted-foreground"
        />
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          {total}
        </span>
        {totalSuffix && (
          <span className="text-xs text-muted-foreground">{totalSuffix}</span>
        )}
      </div>

      <div className="mt-6 flex-1 flex items-end gap-2 sm:gap-4">
        {bars.map((bar, i) => {
          const isSel = sel === i;
          const h = (bar.value / maxV) * 100;
          return (
            <button
              key={bar.key}
              onClick={() => setSel(i)}
              className="flex-1 flex flex-col items-center gap-2 min-w-0"
            >
              <div className="w-full h-28 sm:h-32 flex items-end">
                <div
                  className={cn(
                    "w-full rounded-md transition-all",
                    isSel
                      ? bar.muted
                        ? "bg-destructive"
                        : "bg-primary"
                      : bar.muted
                        ? "bg-destructive/15"
                        : "bg-primary/15",
                  )}
                  style={{ height: `${h}%` }}
                >
                  {isSel && (
                    <div className="w-full text-center pt-1">
                      <span className="text-[11px] font-semibold text-primary-foreground">
                        {bar.value}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground truncate w-full text-center">
                {bar.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function OverviewDistributionChartSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col h-full">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-16 mt-3" />
      <div className="mt-6 flex-1 flex items-end gap-2 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-24 rounded-md" />
        ))}
      </div>
    </div>
  );
}

// ---- Activity section ----

export interface OverviewActivityTileProps {
  value: string | number;
  suffix?: string;
  /** Omit (or null) for a figure with no honest "previous" reading, e.g. a queue — no arrow is drawn. */
  change?: number | null;
  label: string;
  sub?: string;
}

export function OverviewActivityTile({
  value,
  suffix,
  change,
  label,
  sub,
}: OverviewActivityTileProps) {
  const hasChange = change != null;
  const isUp = (change ?? 0) >= 0;
  return (
    <div className="shrink-0 w-[150px] sm:w-[164px] rounded-2xl border border-border bg-card p-4 flex flex-col justify-between h-[140px]">
      <div className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-xl font-semibold text-foreground break-all">{value}</span>
        {suffix && <span className="text-[11px] text-muted-foreground">{suffix}</span>}
        {hasChange && (
          <IconRenderer
            name={isUp ? "arrow_up_outlined" : "arrow_down_outlined"}
            className={cn("size-3.5", isUp ? "text-emerald-600" : "text-red-500")}
          />
        )}
      </div>
      <div>
        <div className="text-xs font-medium text-foreground">{label}</div>
        {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

export function OverviewActivityTileSkeleton() {
  return (
    <div className="shrink-0 w-[150px] sm:w-[164px] rounded-2xl border border-border bg-card p-4 flex flex-col justify-between h-[140px]">
      <Skeleton className="h-6 w-20" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function OverviewActivityGroup({
  icon,
  title,
  children,
}: {
  icon: iconName;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="shrink-0">
      <div className="mb-3 flex items-center gap-2">
        <IconRenderer name={icon} className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="flex gap-3">{children}</div>
    </div>
  );
}

export function OverviewActivitySection({ children }: { children: ReactNode }) {
  const { ref, dragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
    useDragScroll<HTMLDivElement>();
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className={cn(
          "overflow-x-auto [&::-webkit-scrollbar]:hidden",
          dragging ? "cursor-grabbing select-none" : "cursor-grab",
        )}
      >
        <div className="flex min-w-max gap-6 sm:gap-8">{children}</div>
      </div>
    </div>
  );
}
