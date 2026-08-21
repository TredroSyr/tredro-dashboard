// app/(protected)/reps/[id]/rep-detail-client.tsx
"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { RepDetailHeader } from "./rep-detail-header";
import { RepDetailTabs } from "./rep-detail-tabs";
import RepOverview from "./rep-overview";
import { CustomersView } from "@/module/customers/_components/customers-view";

const dummyRep = {
  name: "أحمد الشريف",
  phone: "+963 987 654 321",
  isOnline: true,
  customersCount: 24,
};

type TabValue = "overview" | "invoices" | "orders" | "customers";

export function RepDetailClient({ repId }: { repId: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<TabValue>("overview");

  return (
    <div>
      <RepDetailHeader
        name={dummyRep.name}
        phone={dummyRep.phone}
        isOnline={dummyRep.isOnline}
        customersCount={dummyRep.customersCount}
        onBack={() => router.back()}
      />

      <RepDetailTabs
        value={activeTab}
        onValueChange={setActiveTab}
        counts={{ invoices: 24, orders: 12, customers: 340 }}
        trends={{
          invoices: { direction: "up", percentage: 12 },
          orders: { direction: "down", percentage: 5 },
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
        {activeTab === "customers" && (
          <CustomersView repId={repId} hideBulkAssign />
        )}
      </div>
    </div>
  );
}
