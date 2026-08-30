// rep-detail-header.tsx
"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/tredro/phone-input";
import { DateFilter } from "@/components/tredro/date-filter";
import { Skeleton } from "@/components/ui/skeleton";

interface RepDetailHeaderProps {
  name?: string;
  phone?: string;
  isOnline?: boolean;
  customersCount?: number;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  isLoading?: boolean;
}

export function RepDetailHeader({
  name,
  phone,
  isOnline,
  dateRange,
  onDateRangeChange,
  isLoading = false,
}: RepDetailHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 border-b px-4 py-4 border-border sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center  sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {isLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <h1 className="text-base font-semibold tracking-tight sm:text-lg truncate">
                {name}
              </h1>
            )}
            {isLoading ? (
              <Skeleton className="h-6 w-16 rounded-full" />
            ) : (
              <Badge
                variant={isOnline ? "default" : "destructive"}
                className="flex items-center gap-1 shrink-0"
              >
                {isOnline ? "متصل" : "غير متصل"}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-10 w-48" />
            ) : (
              <PhoneInput value={phone ?? ""} readOnly className="w-full sm:w-auto" />
            )}
          </div>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 gap-1.5 sm:w-auto sm:px-3"
            onClick={() => router.back()}
          >
            <ArrowRight className="h-4 w-4" />
            <span className="hidden sm:inline">رجوع</span>
          </Button>
          <DateFilter
            mode="range"
            value={dateRange}
            onChange={onDateRangeChange}
            className="w-full sm:w-auto"
          />
        </div>
      </div>
    </div>
  );
}
