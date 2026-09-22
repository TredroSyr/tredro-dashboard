// app/(protected)/reps/[id]/rep-detail-client.tsx
"use client";
import * as React from "react";
import { RepDetailHeader } from "./rep-detail-header";
import { RepDetailTabs } from "./rep-detail-tabs";
import RepOverview from "./rep-overview";
import CustomersView from "@/module/customers/_components/customers-view";
import { RepWarehouseTab } from "@/module/warehouses/_components/rep-warehouse-tab";
import { ErrorDisplay } from "@/components/ui/error-display";
import InvoicesView from "@/module/invoices/_components/invoices-view";
import { useOverviewFilters } from "@/components/tredro/overview-toolbar";
import { useRepOverviewQuery, useRepQuery } from "../hooks";
import { useCustomersQuery } from "@/module/customers/hooks";
import { useSalesInvoicesQuery } from "@/module/invoices/hooks";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { usePermissions } from "@/components/provider/PermissionsProvider";

type TabValue = "overview" | "invoices" | "customers" | "warehouse";

export function RepDetailClient({ repId }: { repId: string }) {
  const [activeTab, setActiveTab] = React.useState<TabValue>("overview");
  const { canView } = usePermissions();
  const canViewCustomers = canView("customers");
  const canViewInvoices = canView("invoices");
  // Period + currency live in the header (overview tab only); the overview reads the same filters.
  const overviewFilters = useOverviewFilters();
  // Same key as the query inside RepOverview, so this is one shared request — it only tells the header which currency the server answered in.
  const { data: overviewData } = useRepOverviewQuery(repId, overviewFilters.params);
  const { data: repData, isLoading, isError, refetch } = useRepQuery(repId);
  const rep = repData?.data?.rep;

  // Each count only backs a tab gated on the same module (see rep-detail-tabs)
  // — fetching it without that permission would just 403.
  const { data: customersData, isLoading: isCustomersLoading } =
    useCustomersQuery(repId, { enabled: canViewCustomers });
  const customersCount = customersData?.data?.customers.length ?? 0;

  const { data: invoicesData, isLoading: isInvoicesLoading } =
    useSalesInvoicesQuery({ rep: repId }, { enabled: canViewInvoices });
  const invoicesCount = invoicesData?.data?.pagination.count ?? 0;

  const isCountsLoading =
    (canViewCustomers && isCustomersLoading) ||
    (canViewInvoices && isInvoicesLoading);

  // Show error state with retry button
  if (isError) {
    return (
      <div className="px-6 py-8">
        <ErrorDisplay
          title="حدث خطأ أثناء تحميل بيانات المندوب"
          message="يرجى التحقق من الاتصال بالإنترنت وإعادة المحاولة"
          onRetry={refetch}
        />
      </div>
    );
  }

  // Show no data state if rep is null/undefined but no error
  if (!isLoading && !rep) {
    return (
      <div className="px-6 py-8">
        <ErrorDisplay
          title="المندوب غير موجود"
          message="المندوب الذي تحاول الوصول إليه غير موجود أو تم حذفه"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-20 bg-card">
        {/* Pass isLoading to all components to show skeletons */}
        <RepDetailHeader
          name={rep?.name}
          phone={rep?.phone}
          isOnline={rep?.is_active}
          customersCount={customersCount}
          isLoading={isLoading || isCountsLoading}
          rep={rep}
          filters={activeTab === "overview" ? overviewFilters : undefined}
          serverCurrency={overviewData?.data?.overview?.currency?.code}
          exportParams={overviewFilters.params}
        />

        <RepDetailTabs
          value={activeTab}
          onValueChange={setActiveTab}
          counts={{
            invoices: invoicesCount,
            customers: customersCount,
          }}
          isLoading={isLoading || isCountsLoading}
        />
      </div>

      {/* Only show content areas when not loading OR show skeletons */}
      <div className="px-6 pb-6">
        {activeTab === "overview" && <RepOverview repId={repId} filters={overviewFilters} />}
        {activeTab === "invoices" && (
          <PermissionGate module="invoices" fallback={null}>
            <InvoicesView repId={repId} />
          </PermissionGate>
        )}

        {activeTab === "customers" && (
          <PermissionGate module="customers" fallback={null}>
            <CustomersView repId={repId} />
          </PermissionGate>
        )}
        {activeTab === "warehouse" && (
          <PermissionGate module="warehouses" fallback={null}>
            <RepWarehouseTab repId={repId} />
          </PermissionGate>
        )}
      </div>
    </div>
  );
}
