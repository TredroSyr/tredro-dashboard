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
import { useRepQuery } from "../hooks";
import { useCustomersQuery } from "@/module/customers/hooks";
import { useSalesInvoicesQuery } from "@/module/invoices/hooks";
import { useCustomerRequestsQuery } from "@/module/orders/hooks";

type TabValue = "overview" | "invoices" | "customers" | "warehouse";

export function RepDetailClient({ repId }: { repId: string }) {
  const [activeTab, setActiveTab] = React.useState<TabValue>("overview");
  // The overview's own pinned filter bar has to sit right under this pinned header, whatever its height.
  const [stickyEl, setStickyEl] = React.useState<HTMLDivElement | null>(null);
  const [stickyHeight, setStickyHeight] = React.useState(0);
  React.useEffect(() => {
    if (!stickyEl) return;
    const observer = new ResizeObserver(() => setStickyHeight(stickyEl.offsetHeight));
    observer.observe(stickyEl);
    return () => observer.disconnect();
  }, [stickyEl]);
  const { data: repData, isLoading, isError, refetch } = useRepQuery(repId);
  const rep = repData?.data?.rep;

  const { data: customersData, isLoading: isCustomersLoading } =
    useCustomersQuery(repId);
  const customersCount = customersData?.data?.customers.length ?? 0;

  const { data: invoicesData, isLoading: isInvoicesLoading } =
    useSalesInvoicesQuery({ rep: repId });
  const invoicesCount = invoicesData?.data?.pagination.count ?? 0;

  const { data: ordersData, isLoading: isOrdersLoading } =
    useCustomerRequestsQuery({ rep: repId });
  const ordersCount = ordersData?.data?.pagination.count ?? 0;

  const isCountsLoading =
    isCustomersLoading || isInvoicesLoading || isOrdersLoading;

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
    <div style={{ ["--overview-sticky-top" as string]: `${stickyHeight}px` }}>
      <div ref={setStickyEl} className="sticky top-0 z-20 bg-card">
        {/* Pass isLoading to all components to show skeletons */}
        <RepDetailHeader
          name={rep?.name}
          phone={rep?.phone}
          isOnline={rep?.is_active}
          customersCount={customersCount}
          isLoading={isLoading || isCountsLoading}
          rep={rep}
        />

        <RepDetailTabs
          value={activeTab}
          onValueChange={setActiveTab}
          counts={{
            invoices: invoicesCount,
            orders: ordersCount,
            customers: customersCount,
          }}
          isLoading={isLoading || isCountsLoading}
        />
      </div>

      {/* Only show content areas when not loading OR show skeletons */}
      <div className="px-6 pb-6">
        {activeTab === "overview" && <RepOverview repId={repId} />}
        {activeTab === "invoices" && <InvoicesView repId={repId} />}

        {activeTab === "customers" && <CustomersView repId={repId} />}
        {activeTab === "warehouse" && <RepWarehouseTab repId={repId} />}
      </div>
    </div>
  );
}
