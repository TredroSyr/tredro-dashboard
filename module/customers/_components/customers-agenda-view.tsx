"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import {
  X,
  MapPin,
  List,
  CalendarDays,
  CheckCircle2,
  Circle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DateFilter } from "@/components/tredro/date-filter";
import { cn } from "@/lib/utils";
import { useRepsQuery } from "@/module/reps/hooks";
import { ARABIC_MONTH_NAMES } from "@/components/ui/calendar";
import { WORK_DAYS } from "./work-day-picker";
import { Customer, WorkDay, AssignedRepDetail } from "../types";
import type { CustomersViewMode } from "./customers-view-mode";

const WEEKDAY_ORDER: WorkDay[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

// Hard ceiling on how many days a picked range can project, as a safety net.
const MAX_AGENDA_DAYS = 366;

const VISITED_STORAGE_KEY = "customers-agenda-visited";

interface AgendaVisit {
  customer: Customer;
  reps: AssignedRepDetail[];
}

interface AgendaDayGroup {
  date: Date;
  visits: AgendaVisit[];
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysBetweenInclusive(start: Date, end: Date) {
  const days: Date[] = [];
  let cursor = startOfDay(start);
  const last = startOfDay(end);
  let guard = 0;
  while (cursor.getTime() <= last.getTime() && guard < MAX_AGENDA_DAYS) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
    guard++;
  }
  return days;
}

interface CustomersAgendaViewProps {
  customers: Customer[];
  isLoading?: boolean;
  viewMode?: CustomersViewMode;
  onViewModeChange?: (mode: CustomersViewMode) => void;
  /** Hides the "filter by rep" row - used when the list is already scoped to one rep. */
  hideRepFilter?: boolean;
}

export function CustomersAgendaView({
  customers,
  isLoading,
  viewMode,
  onViewModeChange,
  hideRepFilter = false,
}: CustomersAgendaViewProps) {
  const router = useRouter();
  const { data: repsRes, isLoading: repsLoading } = useRepsQuery();
  const reps = repsRes?.data?.reps ?? [];

  const today = React.useMemo(() => startOfDay(new Date()), []);

  // No range selected => agenda defaults to just today (morning-meeting view).
  const [range, setRange] = React.useState<DateRange | undefined>(undefined);
  const [selectedRepIds, setSelectedRepIds] = React.useState<Set<number>>(
    new Set(),
  );

  // Read-only "visited today" status. Admins can only view this, not set
  // it - it reflects whatever a rep marks from their own side. There's no
  // backend field for this yet, so it's read from local storage for now
  // (same key a future rep-facing surface would write to).
  const [visitedKeys, setVisitedKeys] = React.useState<Set<string>>(
    new Set(),
  );

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(VISITED_STORAGE_KEY);
      if (raw) setVisitedKeys(new Set(JSON.parse(raw)));
    } catch {
      // ignore malformed/unavailable storage
    }
  }, []);

  const repDefaultsMap = React.useMemo(() => {
    const map = new Map<number, WorkDay[]>();
    for (const rep of reps) {
      map.set(rep.id, rep.work_days ?? []);
    }
    return map;
  }, [reps]);

  const toggleRep = (id: number) => {
    setSelectedRepIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const rangeStart = range?.from ?? today;
  const rangeEnd = range?.to ?? range?.from ?? today;

  const agendaDays = React.useMemo<AgendaDayGroup[]>(() => {
    const days: AgendaDayGroup[] = [];
    const candidateDates = daysBetweenInclusive(rangeStart, rangeEnd);

    for (const date of candidateDates) {
      const weekday = WEEKDAY_ORDER[date.getDay()];
      const visits: AgendaVisit[] = [];

      for (const customer of customers) {
        const matchingReps = (customer.assigned_reps_details ?? []).filter(
          (rep) => {
            if (selectedRepIds.size > 0 && !selectedRepIds.has(rep.id)) {
              return false;
            }
            const effectiveDays = rep.work_days?.length
              ? rep.work_days
              : (repDefaultsMap.get(rep.id) ?? []);
            return effectiveDays.includes(weekday);
          },
        );

        if (matchingReps.length > 0) {
          visits.push({ customer, reps: matchingReps });
        }
      }

      if (visits.length > 0) {
        days.push({ date, visits });
      }
    }

    return days;
  }, [customers, rangeStart, rangeEnd, repDefaultsMap, selectedRepIds]);

  const todayLabel = React.useMemo(() => {
    const weekday = WORK_DAYS[today.getDay()].label;
    const day = today.getDate();
    const month = ARABIC_MONTH_NAMES[today.getMonth()];
    const year = today.getFullYear();
    return `اليوم، ${weekday} ${day} ${month} ${year}`;
  }, [today]);

  return (
    <div className="rounded-md border border-border">
      <div className="flex items-center justify-between border-b px-4 sm:px-6 py-6 border-border">
        <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <span>العملاء</span>
          <Badge className="font-normal">{customers.length} عميل</Badge>
        </h1>

        {onViewModeChange && (
          <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className="size-7"
              onClick={() => onViewModeChange("table")}
              title="عرض جدول"
            >
              <List className="size-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "agenda" ? "secondary" : "ghost"}
              size="icon"
              className="size-7"
              onClick={() => onViewModeChange("agenda")}
              title="عرض الجدول الزمني"
            >
              <CalendarDays className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Rep avatar filter - hidden when the list is already scoped to one rep */}
      {!hideRepFilter && (
        <div className="flex flex-wrap items-center gap-2.5 px-4 sm:px-6 py-3 border-b border-border">
          <span className="text-sm font-normal text-muted-foreground shrink-0">
            فلترة حسب المندوب
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {repsLoading ? (
              <>
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="size-8 rounded-full" />
              </>
            ) : (
              reps.map((rep) => {
                const selected = selectedRepIds.has(rep.id);
                return (
                  <button
                    key={rep.id}
                    type="button"
                    onClick={() => toggleRep(rep.id)}
                    title={rep.name}
                    className={cn(
                      "rounded-full transition-all",
                      selected
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "opacity-60 hover:opacity-100",
                    )}
                  >
                    <Avatar>
                      <AvatarFallback className="text-xs font-medium">
                        {rep.name.trim().charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                );
              })
            )}
            {selectedRepIds.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRepIds(new Set())}
                className="gap-1 text-muted-foreground"
              >
                <X className="size-3.5" />
                مسح
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Date range control - defaults to today only */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant={!range ? "secondary" : "outline"}
            size="sm"
            onClick={() => setRange(undefined)}
          >
            اليوم فقط
          </Button>
          <DateFilter mode="range" value={range} onChange={setRange} align="start" />
        </div>
        {!range && (
          <span className="text-sm sm:text-base font-semibold truncate">
            {todayLabel}
          </span>
        )}
      </div>

      {/* Agenda body */}
      <div className="px-4 sm:px-6 py-2">
        {isLoading ? (
          <div className="flex flex-col gap-3 py-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : agendaDays.length === 0 ? (
          <p className="text-center text-sm font-normal text-muted-foreground py-16">
            لا توجد زيارات مجدولة لهذه الفترة
          </p>
        ) : (
          agendaDays.map((group, idx) => {
            const prevGroup = agendaDays[idx - 1];
            const showMonthHeader =
              !prevGroup || prevGroup.date.getMonth() !== group.date.getMonth();
            const groupKey = dateKey(group.date);

            return (
              <React.Fragment key={groupKey}>
                {showMonthHeader && (
                  <div className="pt-4 pb-2 text-sm font-semibold text-primary">
                    {ARABIC_MONTH_NAMES[group.date.getMonth()]}{" "}
                    {group.date.getFullYear()}
                  </div>
                )}
                <div
                  className="grid"
                  style={{ gridTemplateColumns: "72px 1fr" }}
                >
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 py-3 px-1 text-center",
                      isSameDay(group.date, today) && "text-primary",
                    )}
                    style={{ gridRow: `span ${group.visits.length}` }}
                  >
                    <span className="text-lg font-bold leading-none">
                      {group.date.getDate()}
                    </span>
                    <span className="text-[11px] font-normal leading-tight text-muted-foreground">
                      {WORK_DAYS[group.date.getDay()].label}
                    </span>
                  </div>

                  {group.visits.map(({ customer, reps: visitReps }) => {
                    const visitKey = `${groupKey}|${customer.id}`;
                    const isVisited = visitedKeys.has(visitKey);

                    return (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between gap-3 py-3 px-2 border-b border-border last:border-b-0 flex-wrap"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/customers/detail?id=${customer.id}`)
                          }
                          className="flex items-center gap-2 min-w-0 text-right hover:text-primary/80"
                        >
                          <MapPin className="size-4 text-primary shrink-0" />
                          <span className="text-sm font-medium text-primary truncate">
                            {customer.name}
                          </span>
                        </button>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
                          {visitReps.map((rep) => (
                            <Badge
                              key={rep.id}
                              variant="secondary"
                              className="font-normal text-xs px-2 py-0.5"
                            >
                              {rep.name}
                            </Badge>
                          ))}
                          <span
                            title="حالة الزيارة (للعرض فقط)"
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                              isVisited
                                ? "bg-emerald-500/15 text-emerald-600"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {isVisited ? (
                              <CheckCircle2 className="size-3.5" />
                            ) : (
                              <Circle className="size-3.5" />
                            )}
                            {isVisited ? "تمت الزيارة" : "لم تتم بعد"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}
