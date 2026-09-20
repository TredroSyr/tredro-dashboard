"use client";

import { Document, Page, View, Text } from "@react-pdf/renderer";
import type { Company } from "@/module/auth/types";
import {
  PdfDivider,
  PdfFooter,
  PdfHeader,
  PdfKpiSection,
  StatusBadge,
  Table,
  TableNote,
  pdfStyles,
} from "@/components/tredro/pdf/pdf-parts";
import {
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_BADGE_VARIANT,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_BADGE_VARIANT,
} from "@/components/tredro/pdf/pdf-status";
import { buildPeriodLabel, formatPdfAmount, toISODate } from "@/components/tredro/pdf/pdf-utils";
import type { Customer } from "../types";
import { buildPdfKpis, type CustomerPdfData } from "../lib/customer-pdf-data";

interface CustomerProfilePdfDocumentProps {
  customer: Customer;
  data: CustomerPdfData;
  company?: Company | null;
}

export function CustomerProfilePdfDocument({
  customer,
  data,
  company,
}: CustomerProfilePdfDocumentProps) {
  const { overview, invoices, orders } = data;
  const periodLabel = buildPeriodLabel(overview.period);
  const reps = customer.assigned_reps_details;

  return (
    <Document title={`الملف التعريفي - ${customer.name}`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          company={company}
          name={customer.name}
          phone={customer.phone}
          isActive={customer.is_active}
          periodLabel={periodLabel}
        />

        <PdfKpiSection kpis={buildPdfKpis(overview)} periodLabel={periodLabel} />

        <PdfDivider />

        <View id="invoices-table" style={pdfStyles.section} minPresenceAhead={160}>
          <Text style={pdfStyles.sectionTitle}>الفواتير</Text>
          <Text style={pdfStyles.sectionPeriod}>الفترة: {periodLabel}</Text>
          <Table
            headers={["رقم الفاتورة", "التاريخ", "المندوب", "الإجمالي", "الحالة", "المتبقي"]}
            rows={invoices.rows.map((inv) => [
              inv.number,
              toISODate(inv.date),
              inv.rep_name ?? "—",
              `${formatPdfAmount(inv.total_amount)} ${inv.currency}`,
              <StatusBadge
                key="status"
                label={INVOICE_STATUS_LABEL[inv.status]}
                variant={INVOICE_STATUS_BADGE_VARIANT[inv.status]}
              />,
              `${formatPdfAmount(inv.balance_due)} ${inv.currency}`,
            ])}
          />
          <TableNote table={invoices} />
        </View>

        <PdfDivider />

        <View id="orders-table" style={pdfStyles.section} minPresenceAhead={160}>
          <Text style={pdfStyles.sectionTitle}>أحدث الطلبات</Text>
          <Table
            headers={["الحالة", "عدد الأصناف", "تاريخ الطلب", "الفاتورة"]}
            rows={orders.rows.map((o) => [
              <StatusBadge
                key="status"
                label={ORDER_STATUS_LABEL[o.status]}
                variant={ORDER_STATUS_BADGE_VARIANT[o.status]}
              />,
              String(o.line_count),
              toISODate(o.created_at),
              o.fulfilled_by_invoice_number ?? "—",
            ])}
          />
          <TableNote table={orders} />
        </View>

        <PdfDivider />

        <View id="reps-table" style={pdfStyles.section} minPresenceAhead={100}>
          <Text style={pdfStyles.sectionTitle}>المندوبون المسندون</Text>
          <Table
            headers={["الاسم", "رقم الهاتف"]}
            rows={reps.map((r) => [r.name, r.phone])}
          />
        </View>

        <PdfFooter company={company} />
      </Page>
    </Document>
  );
}
