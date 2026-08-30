"use client";
import * as React from "react";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCustomerQuery } from "../hooks";
import { CustomerDetailTabs } from "./customer-detail-tabs";
import { CustomerDetailHeader } from "./customer-detail-header";
import CustomerOverview from "./customer-overview";
import RepsView from "@/module/reps/_components/reps-view";
import InvoicesView from "@/module/invoices/_components/invoices-view";

type TabValue = "overview" | "invoices" | "orders" | "reps";

export function CustomerDetailClient({ customerId }: { customerId: string }) {
  const [activeTab, setActiveTab] = React.useState<TabValue>("overview");
  const { data: customerData, isLoading, isError, refetch } =
    useCustomerQuery(customerId);
  const customer = customerData?.data?.customer;

  // Show error state with retry button
  if (isError) {
    return (
      <div className="px-6 py-8">
        <ErrorDisplay
          title="حدث خطأ أثناء تحميل بيانات العميل"
          message="يرجى التحقق من الاتصال بالإنترنت وإعادة المحاولة"
          onRetry={refetch}
        />
      </div>
    );
  }

  // Show no data state if customer is null/undefined but no error
  if (!isLoading && !customer) {
    return (
      <div className="px-6 py-8">
        <ErrorDisplay
          title="العميل غير موجود"
          message="العميل الذي تحاول الوصول إليه غير موجود أو تم حذفه"
        />
      </div>
    );
  }

  return (
    <div>
      <CustomerDetailHeader
        name={customer?.name}
        phone={customer?.phone}
        email={customer?.email ?? undefined}
        isActive={customer?.is_active}
        repsCount={customer?.assigned_reps_details?.length ?? 0}
        isLoading={isLoading}
      />

      <CustomerDetailTabs
        value={activeTab}
        onValueChange={setActiveTab}
        counts={{ invoices: 0, orders: 0, reps: customer?.assigned_reps_details?.length ?? 0 }}
        trends={{
          invoices: { direction: "up", percentage: 0 },
          orders: { direction: "up", percentage: 0 },
        }}
        isLoading={isLoading}
      />

      <div className="px-6 pb-6">
        {activeTab === "overview" && <CustomerOverview isLoading={isLoading} />}
        {activeTab === "invoices" && <InvoicesView customerId={customerId} />}
        {activeTab === "orders" && (
          <div className="text-sm text-muted-foreground py-8 text-center">
            {isLoading ? "جاري تحميل الطلبات..." : "محتوى الطلبات"}
          </div>
        )}
        {activeTab === "reps" && <RepsView customerId={customerId} />}
      </div>
    </div>
  );
}
