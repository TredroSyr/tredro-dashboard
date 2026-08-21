// rep-detail-header.tsx
"use client";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PhoneInput } from "@/components/tredro/phone-input";
import { DateFilter } from "@/components/tredro/date-filter";
import { Separator } from "@/components/ui/separator";

interface BreadcrumbItemType {
  label: string;
  href?: string;
}

interface RepDetailHeaderProps {
  name: string;
  phone: string;
  isOnline: boolean;
  customersCount: number;
  breadcrumbItems?: BreadcrumbItemType[];
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

export function RepDetailHeader({
  name,
  phone,
  isOnline,
  customersCount,
  breadcrumbItems = [
    { label: "الرئيسية", href: "/" },
    { label: "المناديب", href: "/reps" },
  ],
  dateRange,
  onDateRangeChange,
}: RepDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b px-4 py-4 border-border sm:px-6 sm:py-6">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbItems.map((item) => (
            <React.Fragment key={item.label}>
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </React.Fragment>
          ))}
          <BreadcrumbItem>
            <BreadcrumbPage>{name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Separator />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center  sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight sm:text-lg truncate">
              {name}
            </h1>
            <Badge
              variant={isOnline ? "default" : "destructive"}
              className="flex items-center gap-1 shrink-0"
            >
              {isOnline ? "متصل" : "غير متصل"}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <PhoneInput value={phone} readOnly className="w-full sm:w-auto" />
          </div>
        </div>

        <div className="w-full sm:w-auto">
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
