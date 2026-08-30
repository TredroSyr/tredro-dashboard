"use client";

import * as React from "react";
import { InvoicesTabs, type InvoicesTabValue } from "./invoices-tabs";
import { InvoicesOverview } from "./invoices-overview";
import { SalesInvoicesView } from "./sales-invoices-view";
import { IncomingInvoicesView } from "./incoming-invoices-view";
import { ReturnsCreditsView } from "./returns-credits-view";
import { PaymentsLedgerView } from "./payments-ledger-view";
import { OverdueReportView } from "./overdue-report-view";
import { InvoiceSettingsView } from "./invoice-settings-view";

export default function InvoicesView() {
  const [activeTab, setActiveTab] = React.useState<InvoicesTabValue>("overview");

  return (
    <div className="flex flex-col">
      <InvoicesTabs value={activeTab} onValueChange={setActiveTab} />

      <div className="px-4 py-5 sm:px-6">
        {activeTab === "overview" && <InvoicesOverview />}
        {activeTab === "sales" && <SalesInvoicesView />}
        {activeTab === "incoming" && <IncomingInvoicesView />}
        {activeTab === "returns" && <ReturnsCreditsView />}
        {activeTab === "payments" && <PaymentsLedgerView />}
        {activeTab === "overdue" && <OverdueReportView />}
        {activeTab === "settings" && <InvoiceSettingsView />}
      </div>
    </div>
  );
}
