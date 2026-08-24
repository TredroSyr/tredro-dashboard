// app/(protected)/reps/[id]/rep-detail-client.tsx
"use client";
import * as React from "react";
import { RepDetailHeader } from "./rep-detail-header";
import { RepDetailTabs } from "./rep-detail-tabs";
import RepOverview from "./rep-overview";
import CustomersView from "@/module/customers/_components/customers-view";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useRepQuery } from "../hooks";

type TabValue = "overview" | "invoices" | "orders" | "customers";

export function RepDetailClient({ repId }: { repId: string }) {
  const [activeTab, setActiveTab] = React.useState<TabValue>("overview");
  console.log({repId});
  const { data: repData, isLoading, isError, refetch } = useRepQuery(repId);
  const rep = repData?.data?.rep;

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
      {/* Pass isLoading to all components to show skeletons */}
      <RepDetailHeader
        name={rep?.name}
        phone={rep?.phone}
        isOnline={rep?.is_active}
        customersCount={0} // TODO: Update when we have customer count API for rep
        isLoading={isLoading}
      />

      <RepDetailTabs
        value={activeTab}
        onValueChange={setActiveTab}
        counts={{ invoices: 0, orders: 0, customers: 0 }} // TODO: Update with real counts when APIs are available
        trends={{
          invoices: { direction: "up", percentage: 0 },
          orders: { direction: "up", percentage: 0 },
        }}
        isLoading={isLoading}
      />

      {/* Only show content areas when not loading OR show skeletons */}
      <div className="px-6 pb-6">
        {activeTab === "overview" && <RepOverview isLoading={isLoading} />}
        {activeTab === "invoices" && (
          <div className="text-sm text-muted-foreground py-8 text-center">
            {isLoading ? "جاري تحميل الفواتير..." : "محتوى الفواتير"}
          </div>
        )}
        {activeTab === "orders" && (
          <div className="text-sm text-muted-foreground py-8 text-center">
            {isLoading ? "جاري تحميل الطلبات..." : "محتوى الطلبات"}
          </div>
        )}
        {activeTab === "customers" && <CustomersView />}
      </div>
    </div>
  );
}
