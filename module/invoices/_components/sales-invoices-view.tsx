"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DateFilter } from "@/components/tredro/date-filter";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { EmptyState } from "@/components/tredro/empty-state";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { useCustomersQuery } from "@/module/customers/hooks";
import { useRepsQuery } from "@/module/reps/hooks";
import { InvoicesDataTable } from "./data-table";
import { createSalesInvoiceColumns, isSalesInvoiceOverdue } from "./sales-invoices-columns";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { CreateSalesInvoiceDrawer } from "./create-sales-invoice-drawer";
import { SalesInvoiceStatusBadge } from "./status-badge";
import { LedgerBar } from "./ledger-bar";
import { useInvoiceSettingsQuery, useSalesInvoicesQuery } from "../hooks";
import type { SalesInvoice, SalesInvoiceStatus } from "../types";
import { formatDate, formatMoney, num } from "../lib/format";
import type { DateRange } from "react-day-picker";

const STATUS_OPTIONS: { value: SalesInvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "كل الحالات" },
  { value: "deferred", label: "آجلة" },
  { value: "partially_paid", label: "مدفوعة جزئياً" },
  { value: "fully_paid", label: "مدفوعة بالكامل" },
];

const PAGE_SIZE = 10;

/** Debounces free-text search so it doesn't hit the API on every keystroke. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);
  return debounced;
}

interface SalesInvoicesViewProps {
  customerId?: string | number;
  repId?: string | number;
}

export function SalesInvoicesView({ customerId, repId }: SalesInvoicesViewProps = {}) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [status, setStatus] = React.useState<SalesInvoiceStatus | "all">("all");
  const [customer, setCustomer] = React.useState<string>("");
  const [rep, setRep] = React.useState<string>("");
  const [outstandingOnly, setOutstandingOnly] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [page, setPage] = React.useState(1);
  const [paymentTarget, setPaymentTarget] = React.useState<SalesInvoice | null>(
    null,
  );
  const [createOpen, setCreateOpen] = React.useState(false);

  // Scoped to a single customer/rep (e.g. opened from their detail page) -
  // the matching select is redundant and locked to that id instead.
  const hideCustomerFilter = Boolean(customerId);
  const hideRepFilter = Boolean(repId);

  const { data, isLoading, isError, error, refetch } = useSalesInvoicesQuery({
    page,
    page_size: PAGE_SIZE,
    search: debouncedSearch.trim() || undefined,
    status: status !== "all" ? status : undefined,
    customer: customerId ?? (customer || undefined),
    rep: repId ?? (rep || undefined),
    outstanding: outstandingOnly || undefined,
    date_from: dateRange?.from ? dateRange.from.toISOString().slice(0, 10) : undefined,
    date_to: dateRange?.to ? dateRange.to.toISOString().slice(0, 10) : undefined,
  });
  const { data: settingsData } = useInvoiceSettingsQuery();
  const thresholdDays = settingsData?.data?.settings?.overdue_threshold_days ?? 7;

  const { data: customersRes } = useCustomersQuery();
  const customerOptions = React.useMemo(
    () =>
      (customersRes?.data?.customers ?? []).map((c) => ({
        value: String(c.id),
        label: c.name,
      })),
    [customersRes],
  );

  const { data: repsRes } = useRepsQuery();
  const repOptions = React.useMemo(
    () =>
      (repsRes?.data?.reps ?? []).map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    [repsRes],
  );

  const invoices = React.useMemo(() => data?.data?.invoices ?? [], [data]);
  const pagination = data?.data?.pagination;
  const totalPages = pagination?.total_pages ?? 1;
  const totalCount = pagination?.count ?? invoices.length;
  const hasActiveFilters =
    Boolean(search.trim()) ||
    status !== "all" ||
    (!hideCustomerFilter && Boolean(customer)) ||
    (!hideRepFilter && Boolean(rep)) ||
    outstandingOnly ||
    Boolean(dateRange?.from);

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setCustomer("");
    setRep("");
    setOutstandingOnly(false);
    setDateRange(undefined);
    setPage(1);
  };

  // Any filter change should jump back to page 1.
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, customer, rep, outstandingOnly, dateRange]);

  const columns = React.useMemo(
    () =>
      createSalesInvoiceColumns({
        thresholdDays,
        onRecordPayment: setPaymentTarget,
        onView: (invoice) => router.push(`/invoices/detail?id=${invoice.id}`),
        hideCustomerColumn: hideCustomerFilter,
        hideRepColumn: hideRepFilter,
      }),
    [thresholdDays, router, hideCustomerFilter, hideRepFilter],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
          فواتير البيع
          <Badge className="font-normal">{totalCount}</Badge>
        </h2>
        <PermissionGate module="invoices" requireAction fallback={null}>
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <IconRenderer name="plus_outlined" className="size-4" />
            فاتورة بيع جديدة
          </Button>
        </PermissionGate>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full xs:w-[220px] sm:w-[240px]">
          <IconRenderer name="search_outlined" className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ابحث برقم الفاتورة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>

        <SearchableSelect
          hideSearch
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => setStatus(v as SalesInvoiceStatus | "all")}
          placeholder="كل الحالات"
          className="h-8 w-[150px] rounded-lg"
        />

        {!hideCustomerFilter && (
          <SearchableSelect
            options={customerOptions}
            value={customer}
            onChange={setCustomer}
            placeholder="كل الزبائن"
            searchPlaceholder="ابحث عن زبون..."
            className="h-8 w-[170px] rounded-lg"
          />
        )}

        {!hideRepFilter && (
          <SearchableSelect
            options={repOptions}
            value={rep}
            onChange={setRep}
            placeholder="كل المناديب"
            searchPlaceholder="ابحث عن مندوب..."
            className="h-8 w-[160px] rounded-lg"
          />
        )}

        <DateFilter mode="range" value={dateRange} onChange={setDateRange} />

        <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground">
          <Switch
            checked={outstandingOnly}
            onCheckedChange={(v) => {
              setOutstandingOnly(v);
              setPage(1);
            }}
          />
          عليها رصيد فقط
        </label>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-muted-foreground"
          >
            <IconRenderer name="close_outlined" className="size-4" />
            مسح الفلاتر
          </Button>
        )}
      </div>

      <InvoicesDataTable
        columns={columns}
        data={invoices}
        pagination={{ page, totalPages }}
        onPageChange={setPage}
        isLoading={isLoading}
        isError={isError}
        errorMessage={
          error instanceof Error ? error.message : "حدث خطأ أثناء تحميل الفواتير"
        }
        onRetry={() => refetch()}
        onRowClick={(invoice) => router.push(`/invoices/detail?id=${invoice.id}`)}
        renderMobileCard={(invoice) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-foreground">{invoice.number}</p>
                <p className="text-xs text-muted-foreground">
                  {hideCustomerFilter
                    ? formatDate(invoice.date)
                    : `${invoice.customer_name} · ${formatDate(invoice.date)}`}
                </p>
              </div>
              <SalesInvoiceStatusBadge
                status={invoice.status}
                isOverdue={isSalesInvoiceOverdue(invoice, thresholdDays)}
              />
            </div>
            <LedgerBar
              size="sm"
              totalAmount={invoice.total_amount}
              paidAmount={invoice.paid_amount}
              returnedAmount={invoice.returned_amount}
              balanceDue={invoice.balance_due}
              currency={invoice.currency}
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">الإجمالي {formatMoney(invoice.total_amount, invoice.currency)}</span>
              <span className="font-medium text-foreground">المتبقي {formatMoney(invoice.balance_due, invoice.currency)}</span>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
              <PermissionGate module="invoices" requireAction fallback={null}>
                {num(invoice.balance_due) > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPaymentTarget(invoice);
                    }}
                  >
                    <IconRenderer name="paid_outlined" className="size-3.5" />
                    تسجيل دفعة
                  </Button>
                )}
              </PermissionGate>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/invoices/detail?id=${invoice.id}`);
                }}
              >
                <IconRenderer name="eye_visible_outlined" className="size-3.5" />
                عرض
              </Button>
            </div>
          </div>
        )}
        emptyState={
          hasActiveFilters ? (
            <div className="flex w-full flex-col items-center justify-center px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                لا توجد فواتير مطابقة
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                جرّب تغيير الفلاتر أو مسحها للعودة لكل الفواتير
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                مسح الفلاتر
              </button>
            </div>
          ) : (
            <EmptyState variant="invoices" size="sm" />
          )
        }
      />

      <RecordPaymentDialog
        invoice={paymentTarget}
        open={Boolean(paymentTarget)}
        onOpenChange={(open) => !open && setPaymentTarget(null)}
      />

      <CreateSalesInvoiceDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultCustomerId={customerId}
        defaultRepId={repId}
      />
    </div>
  );
}
