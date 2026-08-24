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
import { Skeleton } from "@/components/ui/skeleton";

interface BreadcrumbItemType {
  label: string;
  href?: string;
}

interface CustomerDetailHeaderProps {
  name?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  repsCount?: number;
  breadcrumbItems?: BreadcrumbItemType[];
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  isLoading?: boolean;
}

export function CustomerDetailHeader({
  name,
  phone,
  email,
  isActive,
  breadcrumbItems = [
    { label: "الرئيسية", href: "/" },
    { label: "الزبائن", href: "/customers" },
  ],
  dateRange,
  onDateRangeChange,
  isLoading = false,
}: CustomerDetailHeaderProps) {
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
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <BreadcrumbPage>{name}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Separator />
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
                variant={isActive ? "default" : "destructive"}
                className="flex items-center gap-1 shrink-0"
              >
                {isActive ? "مفعّل" : "موقوف"}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-10 w-48" />
            ) : (
              <PhoneInput value={phone ?? ""} readOnly className="w-full sm:w-auto" />
            )}
            {!isLoading && email && (
              <span className="text-sm text-muted-foreground">{email}</span>
            )}
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
