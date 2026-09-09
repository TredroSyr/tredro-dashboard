"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { EmptyState } from "@/components/tredro/empty-state";
import { useCustomersQuery } from "@/module/customers/hooks";
import { useRepsQuery } from "@/module/reps/hooks";
import { formatDate } from "@/module/invoices/lib/format";
import { OrdersDataTable } from "./data-table";
import { createOrderColumns } from "./columns";
import { OrderStatusTabs } from "./status-tabs";
import { RequestStatusBadge } from "./status-badge";
import { OrderDetailDrawer } from "./order-detail-drawer";
import { NeedsRepAssignmentBanner } from "./needs-rep-assignment-banner";
import { useCustomerRequestsQuery } from "../hooks";
import type { CustomerRequest, CustomerRequestStatus } from "../types";

interface OrdersViewProps {
  /** Scope to one customer's requests (their "orders" tab) — hides the customer filter/column. */
  customerId?: string | number;
  customerName?: string;
  /** Scope to one rep's requests (their "orders" tab) — hides the rep filter. */
  repId?: string | number;
}

export function OrdersView({ customerId, customerName, repId }: OrdersViewProps = {}) {
  const [status, setStatus] = React.useState<CustomerRequestStatus | "all">("all");
  const [customer, setCustomer] = React.useState("");
  const [rep, setRep] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selectedRequest, setSelectedRequest] = React.useState<CustomerRequest | null>(null);

  const hideCustomerFilter = Boolean(customerId);
  const hideRepFilter = Boolean(repId);

  const { data, isLoading, isError, error, refetch } = useCustomerRequestsQuery({
    status: status !== "all" ? status : undefined,
    customer: customerId ?? (customer || undefined),
    rep: repId ?? (rep || undefined),
    page,
  });

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

  const requests = React.useMemo(() => data?.data?.requests ?? [], [data]);
  const pagination = data?.data?.pagination;
  const totalPages = pagination?.total_pages ?? 1;
  const totalCount = pagination?.count ?? requests.length;

  // Per §4 of the doc, the flag is per customer — every request on this scoped
  // page carries the same value, so one row is enough to decide the banner.
  const showAssignmentBanner = hideCustomerFilter && requests.some((r) => r.needs_rep_assignment);

  React.useEffect(() => {
    setPage(1);
  }, [status, customer, rep]);

  const columns = React.useMemo(
    () =>
      createOrderColumns({
        onView: setSelectedRequest,
        hideCustomerColumn: hideCustomerFilter,
      }),
    [hideCustomerFilter],
  );

  return (
    <div className="flex flex-col gap-4 px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
          طلبات العملاء
          <Badge className="font-normal">{totalCount}</Badge>
        </h2>
      </div>

      {showAssignmentBanner && customerId && (
        <NeedsRepAssignmentBanner
          customerId={Number(customerId)}
          customerName={customerName}
        />
      )}

      <OrderStatusTabs value={status} onChange={setStatus} />

      <div className="flex flex-wrap items-center gap-2">
        {!hideCustomerFilter && (
          <SearchableSelect
            options={customerOptions}
            value={customer}
            onChange={setCustomer}
            placeholder="كل الزبائن"
            searchPlaceholder="ابحث عن زبون..."
            className="h-8 w-[180px] rounded-lg"
          />
        )}

        {!hideRepFilter && (
          <SearchableSelect
            options={repOptions}
            value={rep}
            onChange={setRep}
            placeholder="كل المناديب"
            searchPlaceholder="ابحث عن مندوب..."
            className="h-8 w-[170px] rounded-lg"
          />
        )}
      </div>

      <OrdersDataTable
        columns={columns}
        data={requests}
        pagination={{ page, totalPages }}
        onPageChange={setPage}
        isLoading={isLoading}
        isError={isError}
        errorMessage={
          error instanceof Error ? error.message : "حدث خطأ أثناء تحميل الطلبات"
        }
        onRetry={() => refetch()}
        onRowClick={setSelectedRequest}
        renderMobileCard={(request) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                {!hideCustomerFilter && (
                  <p className="font-medium text-foreground">{request.customer_name}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDate(request.created_at)} · {request.line_count} صنف
                </p>
              </div>
              <RequestStatusBadge status={request.status} />
            </div>
          </div>
        )}
        emptyState={<EmptyState variant="orders" size="sm" />}
      />

      <OrderDetailDrawer
        requestId={selectedRequest?.id ?? null}
        open={Boolean(selectedRequest)}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      />
    </div>
  );
}
