"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import type { SalesInvoice } from "../types";
import { formatDate, formatRepName, num } from "../lib/format";
import { LedgerBar } from "./ledger-bar";
import { SalesInvoiceStatusBadge } from "./status-badge";
import { isSalesInvoiceOverdue } from "./sales-invoices-columns";

export function InvoiceDetailHeader({
  invoice,
  isLoading,
  thresholdDays,
  onRecordPayment,
  onCreateReturn,
}: {
  invoice?: SalesInvoice;
  isLoading?: boolean;
  thresholdDays: number;
  onRecordPayment: () => void;
  onCreateReturn: () => void;
}) {
  const isOverdue = invoice ? isSalesInvoiceOverdue(invoice, thresholdDays) : false;
  const hasBalance = invoice ? num(invoice.balance_due) > 0 : false;

  return (
    <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-6 sm:py-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/home">الرئيسية</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/invoices">الفواتير</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <BreadcrumbPage>{invoice?.number}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {isLoading || !invoice ? (
              <Skeleton className="h-7 w-40" />
            ) : (
              <>
                <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                  {invoice.number}
                </h1>
                <SalesInvoiceStatusBadge status={invoice.status} isOverdue={isOverdue} />
              </>
            )}
          </div>

          {isLoading || !invoice ? (
            <Skeleton className="h-4 w-56" />
          ) : (
            <p className="text-sm text-muted-foreground">
              {invoice.customer_name} · {formatRepName(invoice.rep_name)} ·{" "}
              {formatDate(invoice.date)}
            </p>
          )}
        </div>

        <PermissionGate module="invoices" requireAction fallback={null}>
          {!isLoading && invoice && (
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={onCreateReturn}
              >
                <IconRenderer name="undo_outlined" className="size-4" />
                تسجيل مرتجع
              </Button>
              {hasBalance && (
                <Button size="sm" className="gap-1.5" onClick={onRecordPayment}>
                  <IconRenderer name="paid_outlined" className="size-4" />
                  تسجيل دفعة
                </Button>
              )}
            </div>
          )}
        </PermissionGate>
      </div>

      {isLoading || !invoice ? (
        <Skeleton className="h-3 w-full max-w-md" />
      ) : (
        <LedgerBar
          size="lg"
          totalAmount={invoice.total_amount}
          paidAmount={invoice.paid_amount}
          returnedAmount={invoice.returned_amount}
          balanceDue={invoice.balance_due}
          overageAmount={invoice.overage_amount}
          currency={invoice.currency}
          isOverdue={isOverdue}
          className="max-w-xl"
        />
      )}
    </div>
  );
}
