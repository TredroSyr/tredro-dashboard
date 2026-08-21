// rep-detail-header.tsx
"use client";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/tredro/phone-input";
import { DateRangeFilter } from "@/components/tredro/date-filter";
interface RepDetailHeaderProps {
  name: string;
  phone: string;
  isOnline: boolean;
  customersCount: number;
  onBack?: () => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

export function RepDetailHeader({
  name,
  phone,
  isOnline,
  customersCount,
  onBack,
  dateRange,
  onDateRangeChange,
}: RepDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b px-6 py-6 border-border">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={onBack} aria-label="رجوع">
          <IconRenderer name="arrow2_right_outlined" className="size-4" />
        </Button>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">{name}</h1>
            <Badge
              variant={isOnline ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {isOnline ? "متصل" : "غير متصل"}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <PhoneInput value={phone} readOnly></PhoneInput>
            <span className="flex items-center gap-1">
              <IconRenderer name="users_outlined" className="size-4" />
              {customersCount} زبون مسؤول عنهم
            </span>
          </div>
        </div>
      </div>

      <DateRangeFilter value={dateRange} onChange={onDateRangeChange} />
    </div>
  );
}
