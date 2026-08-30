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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import type { IncomingInvoice } from "../types";
import { formatDate, formatMoney } from "../lib/format";
import { DocumentStatusBadge } from "./status-badge";

export function IncomingInvoiceDetailHeader({
  invoice,
  isLoading,
  onIssue,
  onCancel,
  isIssuing,
  isCancelling,
}: {
  invoice?: IncomingInvoice;
  isLoading?: boolean;
  onIssue: () => void;
  onCancel: () => void;
  isIssuing?: boolean;
  isCancelling?: boolean;
}) {
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

      <Separator />

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
                <DocumentStatusBadge status={invoice.status} />
              </>
            )}
          </div>

          {isLoading || !invoice ? (
            <Skeleton className="h-4 w-56" />
          ) : (
            <p className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              <span>{invoice.warehouse_name}</span>
              <span>·</span>
              <span>{invoice.supplier_ref || "بدون مورّد"}</span>
              <span>· {invoice.currency}</span>
              <span>· {formatDate(invoice.date)}</span>
            </p>
          )}
        </div>

        <PermissionGate module="invoices" requireAction fallback={null}>
          {!isLoading && invoice?.status === "draft" && (
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={isCancelling}
                onClick={onCancel}
              >
                <IconRenderer name="close_outlined" className="size-4" />
                إلغاء
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={isIssuing}
                onClick={onIssue}
              >
                <IconRenderer name="tick_outlined" className="size-4" />
                ترحيل
              </Button>
            </div>
          )}
        </PermissionGate>
      </div>

      {isLoading || !invoice ? (
        <Skeleton className="h-8 w-40" />
      ) : (
        <span className="tabular-nums text-2xl font-semibold text-foreground">
          {formatMoney(invoice.total_amount, invoice.currency)}
        </span>
      )}
    </div>
  );
}
