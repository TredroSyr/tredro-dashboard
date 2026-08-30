"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DateFilter } from "@/components/tredro/date-filter";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { EmptyState } from "@/components/tredro/empty-state";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { IconRenderer } from "@/assets/icons/iconRenderer";
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

export function SalesInvoicesView() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
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

  const params = React.useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status === "all" ? undefined : status,
      customer: customer || undefined,
      rep: rep || undefined,
      outstanding: outstandingOnly || undefined,
      date_from: dateRange?.from?.toISOString(),
      date_to: dateRange?.to?.toISOString(),
      page,
    }),
    [search, status, customer, rep, outstandingOnly, dateRange, page],
  );

  const { data, isLoading, isError, error, refetch } = useSalesInvoicesQuery(
    params,
  );
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

  const invoices = data?.data?.invoices ?? [];
  const pagination = data?.data?.pagination;
  const hasActiveFilters =
    Boolean(search.trim()) ||
    status !== "all" ||
    Boolean(customer) ||
    Boolean(rep) ||
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

  const columns = React.useMemo(
    () =>
      createSalesInvoiceColumns({
        thresholdDays,
        onRecordPayment: setPaymentTarget,
        onView: (invoice) => router.push(`/invoices/detail?id=${invoice.id}`),
      }),
    [thresholdDays, router],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
          فواتير البيع
          {pagination && <Badge className="font-normal">{pagination.count}</Badge>}
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
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ابحث برقم الفاتورة..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pr-9"
          />
        </div>

        <SearchableSelect
          hideSearch
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => {
            setStatus(v as SalesInvoiceStatus | "all");
            setPage(1);
          }}
          placeholder="كل الحالات"
          className="h-8 w-[150px] rounded-lg"
        />

        <SearchableSelect
          options={customerOptions}
          value={customer}
          onChange={(v) => {
            setCustomer(v);
            setPage(1);
          }}
          placeholder="كل الزبائن"
          searchPlaceholder="ابحث عن زبون..."
          className="h-8 w-[170px] rounded-lg"
        />

        <SearchableSelect
          options={repOptions}
          value={rep}
          onChange={(v) => {
            setRep(v);
            setPage(1);
          }}
          placeholder="كل المناديب"
          searchPlaceholder="ابحث عن مندوب..."
          className="h-8 w-[160px] rounded-lg"
        />

        <DateFilter
          mode="range"
          value={dateRange}
          onChange={(v) => {
            setDateRange(v);
            setPage(1);
          }}
        />

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
            <X className="size-4" />
            مسح الفلاتر
          </Button>
        )}
      </div>

      <InvoicesDataTable
        columns={columns}
        data={invoices}
        pagination={
          pagination
            ? { page: pagination.page, totalPages: pagination.total_pages }
            : undefined
        }
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
                  {invoice.customer_name} · {formatDate(invoice.date)}
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

      <CreateSalesInvoiceDrawer open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
