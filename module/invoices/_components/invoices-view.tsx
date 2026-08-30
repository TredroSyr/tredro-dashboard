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

interface InvoicesViewProps {
  /** Scope every invoice API call to this customer (e.g. shown from the customer's detail page). */
  customerId?: string | number;
  /** Scope every invoice API call to this rep (e.g. shown from the rep's detail page). */
  repId?: string | number;
}

export default function InvoicesView({ customerId, repId }: InvoicesViewProps = {}) {
  const isScoped = Boolean(customerId || repId);
  const [activeTab, setActiveTab] = React.useState<InvoicesTabValue>(
    isScoped ? "sales" : "overview",
  );

  return (
    <div className="flex flex-col">
      <InvoicesTabs
        value={activeTab}
        onValueChange={setActiveTab}
        customerId={customerId}
        repId={repId}
      />

      <div className="px-4 py-5 sm:px-6">
        {activeTab === "overview" && <InvoicesOverview />}
        {activeTab === "sales" && (
          <SalesInvoicesView customerId={customerId} repId={repId} />
        )}
        {activeTab === "incoming" && <IncomingInvoicesView />}
        {activeTab === "returns" && (
          <ReturnsCreditsView customerId={customerId} repId={repId} />
        )}
        {activeTab === "payments" && (
          <PaymentsLedgerView customerId={customerId} repId={repId} />
        )}
        {activeTab === "overdue" && (
          <OverdueReportView customerId={customerId} repId={repId} />
        )}
        {activeTab === "settings" && <InvoiceSettingsView />}
      </div>
    </div>
  );
}
