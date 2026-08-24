// app/(protected)/reps/[id]/rep-detail-client.tsx
"use client";
import * as React from "react";
import { RepDetailHeader } from "./rep-detail-header";
import { RepDetailTabs } from "./rep-detail-tabs";
import RepOverview from "./rep-overview";
import CustomersView from "@/module/customers/_components/customers-view";
import { useRepQuery } from "../hooks";

type TabValue = "overview" | "invoices" | "orders" | "customers";

export function RepDetailClient({ repId }: { repId: string }) {
  const [activeTab, setActiveTab] = React.useState<TabValue>("overview");
  const { data: repData, isLoading, isError } = useRepQuery(repId);
  const rep = repData?.data?.rep;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">جاري تحميل بيانات المندوب...</div>
      </div>
    );
  }

  if (isError || !rep) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">حدث خطأ أثناء تحميل بيانات المندوب</div>
      </div>
    );
  }

  return (
    <div>
      <RepDetailHeader
        name={rep.name}
        phone={rep.phone}
        isOnline={rep.is_active}
        customersCount={0} // TODO: Update when we have customer count API for rep
      />

      <RepDetailTabs
        value={activeTab}
        onValueChange={setActiveTab}
        counts={{ invoices: 0, orders: 0, customers: 0 }} // TODO: Update with real counts when APIs are available
        trends={{
          invoices: { direction: "up", percentage: 0 },
          orders: { direction: "up", percentage: 0 },
        }}
      />
      <div className="px-6 pb-6">
        {activeTab === "overview" && <RepOverview />}
        {activeTab === "invoices" && (
          <div className="text-sm text-muted-foreground">محتوى الفواتير</div>
        )}
        {activeTab === "orders" && (
          <div className="text-sm text-muted-foreground">محتوى الطلبات</div>
        )}
        {activeTab === "customers" && <CustomersView />}
      </div>
    </div>
  );
}
