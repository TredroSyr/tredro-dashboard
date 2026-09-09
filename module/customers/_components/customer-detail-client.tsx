"use client";
import * as React from "react";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCustomerQuery } from "../hooks";
import { CustomerDetailTabs } from "./customer-detail-tabs";
import { CustomerDetailHeader } from "./customer-detail-header";
import CustomerOverview from "./customer-overview";
import RepsView from "@/module/reps/_components/reps-view";
import InvoicesView from "@/module/invoices/_components/invoices-view";
import { OrdersView } from "@/module/orders/_components/orders-view";
import { useCustomerRequestsQuery } from "@/module/orders/hooks";

type TabValue = "overview" | "invoices" | "orders" | "reps";

export function CustomerDetailClient({ customerId }: { customerId: string }) {
  const [activeTab, setActiveTab] = React.useState<TabValue>("overview");
  const { data: customerData, isLoading, isError, refetch } =
    useCustomerQuery(customerId);
  const customer = customerData?.data?.customer;
  // There is no nested customer/orders route — the count is the same ?customer=
  // filtered list the "orders" tab itself renders (see the customer-requests doc §6).
  const { data: requestsData } = useCustomerRequestsQuery({ customer: customerId });
  const ordersCount = requestsData?.data?.pagination?.count ?? 0;

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
        counts={{ invoices: 0, orders: ordersCount, reps: customer?.assigned_reps_details?.length ?? 0 }}
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
          <OrdersView customerId={customerId} customerName={customer?.name} />
        )}
        {activeTab === "reps" && <RepsView customerId={customerId} />}
      </div>
    </div>
  );
}
