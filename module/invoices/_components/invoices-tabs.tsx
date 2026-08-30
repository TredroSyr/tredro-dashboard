"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { iconName } from "@/assets/icons/iconRenderer/types";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import {
  useIncomingInvoicesQuery,
  useOverdueReportQuery,
  usePaymentsQuery,
  useReturnInvoicesQuery,
  useSalesInvoicesQuery,
} from "../hooks";
import { formatMoney } from "../lib/format";

export type InvoicesTabValue =
  | "overview"
  | "sales"
  | "incoming"
  | "returns"
  | "payments"
  | "overdue"
  | "settings";

function firstDayOfMonthISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function TabTile({
  icon,
  label,
  value,
  isLoading,
  isActive,
  tone = "default",
  onClick,
}: {
  icon: iconName;
  label: string;
  value?: string;
  isLoading?: boolean;
  isActive: boolean;
  tone?: "default" | "destructive";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex min-w-[150px] cursor-pointer shrink-0 items-center gap-3 rounded-2xl border p-3.5 text-right transition-colors motion-safe:duration-150 sm:min-w-0 sm:p-4",
        isActive
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-muted/40",
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          isActive
            ? "bg-primary text-primary-foreground"
            : tone === "destructive"
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary",
        )}
      >
        <IconRenderer name={icon} className="size-4.5" />
      </div>
      <div className="min-w-0">
        {value !== undefined &&
          (isLoading ? (
            <Skeleton className="h-5 w-14" />
          ) : (
            <div className="truncate text-base font-semibold tabular-nums text-foreground sm:text-lg">
              {value}
            </div>
          ))}
        <div className="truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </button>
  );
}

export function InvoicesTabs({
  value,
  onValueChange,
  customerId,
  repId,
}: {
  value: InvoicesTabValue;
  onValueChange: (value: InvoicesTabValue) => void;
  customerId?: string | number;
  repId?: string | number;
}) {
  const isScoped = Boolean(customerId || repId);
  const { data: salesData, isLoading: isSalesLoading } = useSalesInvoicesQuery(
    { customer: customerId, rep: repId },
  );
  const { data: incomingData, isLoading: isIncomingLoading } =
    useIncomingInvoicesQuery(undefined, { enabled: !isScoped });
  const { data: returnsData, isLoading: isReturnsLoading } =
    useReturnInvoicesQuery({ customer: customerId, rep: repId });
  const { data: paymentsData, isLoading: isPaymentsLoading } = usePaymentsQuery(
    {
      date_from: firstDayOfMonthISO(),
      customer: customerId,
      rep: repId,
    },
  );
  const { data: overdueData, isLoading: isOverdueLoading } =
    useOverdueReportQuery({ customer: customerId, rep: repId });

  return (
    <div className="px-4 py-4 sm:px-6">
      <div
        className={cn(
          "flex gap-2.5 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] sm:grid sm:overflow-visible [&::-webkit-scrollbar]:hidden",
          isScoped ? "sm:grid-cols-4" : "sm:grid-cols-4 lg:grid-cols-7",
        )}
        dir="rtl"
      >
        {!isScoped && (
          <TabTile
            icon="overview_outlined"
            label="نظرة عامة"
            isActive={value === "overview"}
            onClick={() => onValueChange("overview")}
          />
        )}
        <TabTile
          icon="sales_outlined"
          label="فواتير البيع"
          value={
            salesData?.data?.pagination
              ? String(salesData.data.pagination.count)
              : undefined
          }
          isLoading={isSalesLoading}
          isActive={value === "sales"}
          onClick={() => onValueChange("sales")}
        />
        {!isScoped && (
          <TabTile
            icon="download_outlined"
            label="فواتير الإدخال"
            value={
              incomingData?.data?.pagination
                ? String(incomingData.data.pagination.count)
                : undefined
            }
            isLoading={isIncomingLoading}
            isActive={value === "incoming"}
            onClick={() => onValueChange("incoming")}
          />
        )}
        <TabTile
          icon="undo_outlined"
          label="المرتجعات والأرصدة"
          value={
            returnsData?.data?.pagination
              ? String(returnsData.data.pagination.count)
              : undefined
          }
          isLoading={isReturnsLoading}
          isActive={value === "returns"}
          onClick={() => onValueChange("returns")}
        />
        <TabTile
          icon="transaction_outlined"
          label="محصّل هذا الشهر"
          value={
            paymentsData?.data?.total_amount !== undefined
              ? formatMoney(paymentsData.data.total_amount)
              : undefined
          }
          isLoading={isPaymentsLoading}
          isActive={value === "payments"}
          onClick={() => onValueChange("payments")}
        />
        <TabTile
          icon="report_outlined"
          label="الديون المتأخرة"
          value={
            overdueData?.data?.report
              ? String(overdueData.data.report.totals.invoice_count)
              : undefined
          }
          isLoading={isOverdueLoading}
          isActive={value === "overdue"}
          tone="destructive"
          onClick={() => onValueChange("overdue")}
        />

        {!isScoped && (
          <PermissionGate module="invoices" requireAction fallback={null}>
            <TabTile
              icon="settings_outlined"
              label="الإعدادات"
              isActive={value === "settings"}
              onClick={() => onValueChange("settings")}
            />
          </PermissionGate>
        )}
      </div>
    </div>
  );
}
