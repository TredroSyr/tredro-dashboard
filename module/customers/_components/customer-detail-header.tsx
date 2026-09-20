"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/tredro/phone-input";
import { DateFilter } from "@/components/tredro/date-filter";
import {
  CurrencyFilter,
  type useOverviewFilters,
} from "@/components/tredro/overview-toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerRepControl } from "./customer-rep-control";
import { CustomerPdfDownloadButton } from "./customer-pdf-download-button";
import type { Customer, CustomerOverviewParams } from "../types";

interface CustomerDetailHeaderProps {
  name?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  customer?: Customer;
  /** Period + currency filters; only passed while the overview tab is active. */
  filters?: ReturnType<typeof useOverviewFilters>;
  /** The currency the server actually used — highlighted until the user picks one. */
  serverCurrency?: string;
  /** Period + currency the PDF export should use — the current filter selection, whichever tab is open. */
  exportParams: CustomerOverviewParams;
  isLoading?: boolean;
}

export function CustomerDetailHeader({
  name,
  phone,
  email,
  isActive,
  customer,
  filters,
  serverCurrency,
  exportParams,
  isLoading = false,
}: CustomerDetailHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 border-b px-4 py-4 border-border sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center  sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 gap-1.5 sm:w-auto sm:px-3"
              onClick={() => router.back()}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
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
            {isLoading ? (
              <Skeleton className="h-10 w-48" />
            ) : (
              <PhoneInput
                value={phone ?? ""}
                readOnly
                className="w-full sm:w-auto text-sm text-muted-foreground"
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {!isLoading && email && (
              <span className="text-sm text-muted-foreground">{email}</span>
            )}
            {isLoading ? (
              <Skeleton className="h-8 w-28 rounded-md" />
            ) : (
              customer && <CustomerRepControl customer={customer} />
            )}
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {filters && (
            <>
              <DateFilter
                mode="range"
                value={filters.dateRange}
                onChange={filters.setDateRange}
                className="w-full sm:w-auto"
              />
              <CurrencyFilter
                value={filters.currency ?? serverCurrency}
                onChange={filters.setCurrency}
              />
            </>
          )}
          {isLoading ? (
            <Skeleton className="size-8 shrink-0 rounded-lg sm:w-28" />
          ) : (
            customer && <CustomerPdfDownloadButton customer={customer} params={exportParams} />
          )}
        </div>
      </div>
    </div>
  );
}
