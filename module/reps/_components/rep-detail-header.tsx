// rep-detail-header.tsx
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
import type { Rep, RepOverviewParams } from "../types";
import { RepPdfDownloadButton } from "./rep-pdf-download-button";

interface RepDetailHeaderProps {
  name?: string;
  phone?: string;
  isOnline?: boolean;
  customersCount?: number;
  /** Period + currency filters; only passed while the overview tab is active. */
  filters?: ReturnType<typeof useOverviewFilters>;
  /** The currency the server actually used — highlighted until the user picks one. */
  serverCurrency?: string;
  /** Period + currency the PDF export should use — the current filter selection, whichever tab is open. */
  exportParams: RepOverviewParams;
  isLoading?: boolean;
  rep?: Rep;
}

export function RepDetailHeader({
  name,
  phone,
  isOnline,
  filters,
  serverCurrency,
  exportParams,
  isLoading = false,
  rep,
}: RepDetailHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 border-b px-4 py-4 border-border sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center  sm:justify-between">
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
            <Skeleton className="h-10 w-48" />
          ) : (
            <PhoneInput
              value={phone ?? ""}
              readOnly
              className="w-full sm:w-auto text-sm text-muted-foreground"
            />
          )}
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
            rep && <RepPdfDownloadButton rep={rep} params={exportParams} />
          )}
        </div>
      </div>
    </div>
  );
}
