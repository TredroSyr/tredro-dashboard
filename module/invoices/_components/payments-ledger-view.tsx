"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { DateFilter } from "@/components/tredro/date-filter";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { useRepsQuery } from "@/module/reps/hooks";
import { useCustomersQuery } from "@/module/customers/hooks";
import { InvoicesDataTable } from "./data-table";
import { usePaymentsQuery } from "../hooks";
import type { PaymentCollection, PaymentSource } from "../types";
import { formatDateTime, formatMoney } from "../lib/format";
import type { DateRange } from "react-day-picker";

const SOURCE_OPTIONS: { value: PaymentSource | "all"; label: string }[] = [
  { value: "all", label: "كل المصادر" },
  { value: "cash", label: "نقدي" },
  { value: "customer_credit", label: "رصيد دائن" },
];

const SOURCE_LABEL: Record<PaymentSource, string> = {
  cash: "نقدي",
  customer_credit: "رصيد دائن",
};

function createPaymentColumns(): ColumnDef<PaymentCollection>[] {
  return [
    {
      accessorKey: "sales_invoice_number",
      header: "الفاتورة",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.sales_invoice_number}
        </span>
      ),
    },
    {
      accessorKey: "amount",
      header: "المبلغ",
      cell: ({ row }) => (
        <span className="tabular-nums text-foreground">
          {formatMoney(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: "source",
      header: "طريقة التحصيل",
      cell: ({ row }) => (
        <Badge variant={row.original.source === "cash" ? "success" : "secondary"}>
          {SOURCE_LABEL[row.original.source]}
        </Badge>
      ),
    },
    {
      accessorKey: "collected_by_name",
      header: "حصّلها",
      cell: ({ row }) => (
        <span className="text-foreground">
          {row.original.collected_by_name || "—"}
        </span>
      ),
    },
    {
      accessorKey: "collected_at",
      header: "التاريخ",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDateTime(row.original.collected_at)}
        </span>
      ),
    },
    {
      accessorKey: "note",
      header: "ملاحظة",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.note || "—"}</span>
      ),
    },
  ];
}

const PAGE_SIZE = 10;

interface PaymentsLedgerViewProps {
  customerId?: string | number;
  repId?: string | number;
}

export function PaymentsLedgerView({ customerId, repId }: PaymentsLedgerViewProps = {}) {
  const [source, setSource] = React.useState<PaymentSource | "all">("all");
  const [rep, setRep] = React.useState("");
  const [customer, setCustomer] = React.useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [page, setPage] = React.useState(1);

  // Scoped to a single customer/rep (e.g. opened from their detail page) -
  // the matching select is redundant and locked to that id instead.
  const hideCustomerFilter = Boolean(customerId);
  const hideRepFilter = Boolean(repId);

  const { data, isLoading, isError, error, refetch } = usePaymentsQuery({
    page,
    page_size: PAGE_SIZE,
    source: source !== "all" ? source : undefined,
    rep: repId ?? (rep || undefined),
    customer: customerId ?? (customer || undefined),
    date_from: dateRange?.from ? dateRange.from.toISOString().slice(0, 10) : undefined,
    date_to: dateRange?.to ? dateRange.to.toISOString().slice(0, 10) : undefined,
  });
  const payments = React.useMemo(() => data?.data?.payments ?? [], [data]);
  const pagination = data?.data?.pagination;
  const totalPages = pagination?.total_pages ?? 1;
  const totalCount = pagination?.count ?? payments.length;
  const totalAmount = data?.data?.total_amount;

  const hasActiveFilters =
    source !== "all" ||
    (!hideRepFilter && Boolean(rep)) ||
    (!hideCustomerFilter && Boolean(customer)) ||
    Boolean(dateRange?.from);

  // Any filter change should jump back to page 1.
  React.useEffect(() => {
    setPage(1);
  }, [source, rep, customer, dateRange]);

  const { data: repsRes } = useRepsQuery();
  const repOptions = React.useMemo(
    () =>
      (repsRes?.data?.reps ?? []).map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    [repsRes],
  );

  const { data: customersRes } = useCustomersQuery();
  const customerOptions = React.useMemo(
    () =>
      (customersRes?.data?.customers ?? []).map((c) => ({
        value: String(c.id),
        label: c.name,
      })),
    [customersRes],
  );

  const columns = React.useMemo(() => createPaymentColumns(), []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
          سجل التحصيلات
          <Badge className="font-normal">{totalCount}</Badge>
        </h2>
        <span className="text-sm text-muted-foreground">
          إجمالي المحصّل ضمن هذه الفلاتر:{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {formatMoney(totalAmount ?? "0")}
          </span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchableSelect
          hideSearch
          options={SOURCE_OPTIONS}
          value={source}
          onChange={(v) => setSource(v as PaymentSource | "all")}
          placeholder="كل المصادر"
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
            placeholder="من حصّلها (كل المناديب)"
            searchPlaceholder="ابحث عن مندوب..."
            className="h-8 w-[190px] rounded-lg"
          />
        )}

        <DateFilter mode="range" value={dateRange} onChange={setDateRange} />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSource("all");
              setRep("");
              setCustomer("");
              setDateRange(undefined);
            }}
            className="gap-1 text-muted-foreground"
          >
            <IconRenderer name="close_outlined" className="size-4" />
            مسح الفلاتر
          </Button>
        )}
      </div>

      <InvoicesDataTable
        columns={columns}
        data={payments}
        pagination={{ page, totalPages }}
        onPageChange={setPage}
        isLoading={isLoading}
        isError={isError}
        errorMessage={
          error instanceof Error ? error.message : "حدث خطأ أثناء تحميل التحصيلات"
        }
        onRetry={() => refetch()}
        renderMobileCard={(payment: PaymentCollection) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">
                {payment.sales_invoice_number}
              </span>
              <span className="tabular-nums text-foreground">
                {formatMoney(payment.amount)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {payment.collected_by_name || "—"} ·{" "}
              {formatDateTime(payment.collected_at)}
            </span>
          </div>
        )}
        emptyState={
          <div className="flex w-full flex-col items-center justify-center px-6 py-10 text-center text-sm text-muted-foreground">
            لا توجد تحصيلات مطابقة لهذه الفلاتر
          </div>
        }
      />
    </div>
  );
}
