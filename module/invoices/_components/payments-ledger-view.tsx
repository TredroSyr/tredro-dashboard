"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DateFilter } from "@/components/tredro/date-filter";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { useRepsQuery } from "@/module/reps/hooks";
import { InvoicesDataTable } from "./data-table";
import { usePaymentsQuery } from "../hooks";
import type { PaymentCollection, PaymentSource } from "../types";
import { formatDateTime, formatMoney, num } from "../lib/format";
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

export function PaymentsLedgerView() {
  const [source, setSource] = React.useState<PaymentSource | "all">("all");
  const [rep, setRep] = React.useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [page, setPage] = React.useState(1);

  const { data, isLoading, isError, error, refetch } = usePaymentsQuery({
    page_size: 1000,
  });
  const allPayments = React.useMemo(() => data?.data?.payments ?? [], [data]);

  const filteredPayments = React.useMemo(() => {
    return allPayments.filter((payment) => {
      if (source !== "all" && payment.source !== source) return false;
      if (rep && String(payment.collected_by) !== rep) return false;
      if (dateRange?.from && new Date(payment.collected_at) < dateRange.from) return false;
      if (dateRange?.to && new Date(payment.collected_at) > dateRange.to) return false;
      return true;
    });
  }, [allPayments, source, rep, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const payments = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPayments.slice(start, start + PAGE_SIZE);
  }, [filteredPayments, page]);
  const totalAmount = React.useMemo(
    () => filteredPayments.reduce((sum, p) => sum + num(p.amount), 0),
    [filteredPayments],
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

  const columns = React.useMemo(() => createPaymentColumns(), []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
          سجل التحصيلات
          <Badge className="font-normal">{filteredPayments.length}</Badge>
        </h2>
        <span className="text-sm text-muted-foreground">
          إجمالي المحصّل ضمن هذه الفلاتر:{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {formatMoney(totalAmount)}
          </span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchableSelect
          hideSearch
          options={SOURCE_OPTIONS}
          value={source}
          onChange={(v) => {
            setSource(v as PaymentSource | "all");
            setPage(1);
          }}
          placeholder="كل المصادر"
          className="h-8 w-[150px] rounded-lg"
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
