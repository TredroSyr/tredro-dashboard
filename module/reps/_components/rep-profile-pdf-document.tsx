"use client";

import * as React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  Link,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { formatDateShort } from "@/lib/format";
import type { Company } from "@/module/auth/types";
import type { Rep } from "../types";
import { PdfIcon } from "../lib/rep-pdf-icons";
import {
  DUMMY_KPIS,
  DUMMY_INVOICES,
  DUMMY_CUSTOMERS,
  DUMMY_ORDERS,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_BADGE_VARIANT,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_BADGE_VARIANT,
  PDF_BADGE_COLORS,
} from "../lib/rep-pdf-dummy-data";

/** Illustrative period for the dummy stats — trailing 30 days ending today. */
function buildDummyPeriodLabel(): string {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  return `${formatDateShort(from.toISOString())} - ${formatDateShort(to.toISOString())}`;
}

Font.register({
  family: "Thmanyah",
  fonts: [
    { src: "/fonts/thmanyah/thmanyahsans-Regular.woff2", fontWeight: 400 },
    { src: "/fonts/thmanyah/thmanyahsans-Medium.woff2", fontWeight: 500 },
    { src: "/fonts/thmanyah/thmanyahsans-Bold.woff2", fontWeight: 700 },
  ],
});

const ACCENT = "#2563EB";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Thmanyah",
    direction: "rtl",
    textAlign: "right",
    fontSize: 10,
    padding: 28,
    color: "#111827",
  },
  headerBlock: {
    alignItems: "center",
    marginBottom: 18,
    paddingBottom: 16,
    borderBottom: "1pt solid #E5E7EB",
  },
  companyRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  companyLogo: {
    width: 32,
    height: 32,
    borderRadius: 4,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 12,
    fontWeight: 700,
    color: "#111827",
  },
  repIdentityRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  repName: {
    fontSize: 17,
    fontWeight: 700,
    textAlign: "center",
    textDecoration: "none",
    color: "#111827",
  },
  repPhoneLink: {
    fontSize: 10.5,
    color: ACCENT,
    textAlign: "center",
    textDecoration: "none",
    marginBottom: 4,
  },
  headerPeriod: {
    fontSize: 9,
    color: "#6B7280",
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 6,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
  },
  sectionPeriod: {
    fontSize: 9,
    color: "#6B7280",
    marginBottom: 8,
  },
  kpiGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
  },
  kpiCard: {
    width: "31%",
    borderRadius: 8,
    border: "1pt solid #E5E7EB",
    padding: 10,
  },
  kpiIconRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  kpiIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiLabel: {
    fontSize: 8.5,
    color: "#6B7280",
    flex: 1,
  },
  kpiValue: {
    fontSize: 13,
    fontWeight: 700,
  },
  table: {
    borderRadius: 6,
    overflow: "hidden",
    border: "1pt solid #E5E7EB",
  },
  tableRow: {
    flexDirection: "row-reverse",
    borderBottom: "1pt solid #E5E7EB",
  },
  tableRowLast: {
    flexDirection: "row-reverse",
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  tableHeaderRow: {
    flexDirection: "row-reverse",
    backgroundColor: ACCENT,
    // `overflow: hidden` on the outer table isn't reliably clipping this fill's
    // corners, so round them directly to match the table's own radius.
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  cell: {
    flex: 1,
    padding: 6,
    // Row-reverse (not alignSelf) is the mechanism already proven to pack content to the
    // right elsewhere in this document — reused here so badge cells line up with text cells.
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  cellText: {
    fontSize: 9,
  },
  headerCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    fontWeight: 700,
    color: "#FFFFFF",
  },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: 700,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 28,
    right: 28,
  },
  footerBrandRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 4,
  },
  footerLogo: {
    width: 14,
    height: 14,
    borderRadius: 2,
    objectFit: "contain",
  },
  footerCompanyName: {
    fontSize: 9,
    fontWeight: 700,
    color: "#6B7280",
  },
  footerDisclaimer: {
    fontSize: 8,
    color: "#9CA3AF",
    textAlign: "center",
  },
});

function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: keyof typeof PDF_BADGE_COLORS;
}) {
  const color = PDF_BADGE_COLORS[variant];
  return (
    <View style={[styles.statusBadge, { backgroundColor: color.bg }]}>
      <Text style={[styles.statusBadgeText, { color: color.text }]}>
        {label}
      </Text>
    </View>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeaderRow}>
        {headers.map((h, i) => (
          <Text key={i} style={styles.headerCell}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View
          key={ri}
          wrap={false}
          style={ri === rows.length - 1 ? styles.tableRowLast : styles.tableRow}
        >
          {row.map((cell, ci) => (
            <View key={ci} style={styles.cell}>
              {typeof cell === "string" ? (
                <Text style={styles.cellText}>{cell}</Text>
              ) : (
                cell
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

interface RepProfilePdfDocumentProps {
  rep: Rep;
  company?: Company | null;
}

export function RepProfilePdfDocument({ rep, company }: RepProfilePdfDocumentProps) {
  const periodLabel = buildDummyPeriodLabel();

  return (
    <Document title={`الملف التعريفي - ${rep.name}`}>
      <Page size="A4" style={styles.page}>
        <View id="doc-top" style={styles.headerBlock}>
          {company && (
            <View style={styles.companyRow}>
              {company.logo && (
                // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not a DOM <img>
                <Image src={company.logo} style={styles.companyLogo} />
              )}
              <Text style={styles.companyName}>{company.name}</Text>
            </View>
          )}
          <View style={styles.repIdentityRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: rep.is_active ? "#16A34A" : "#9CA3AF" },
              ]}
            />
            <Link src="#doc-top" style={styles.repName}>
              {rep.name}
            </Link>
          </View>
          <Link src={`tel:${rep.phone}`} style={styles.repPhoneLink}>
            {rep.phone}
          </Link>
          <Text style={styles.headerPeriod}>الفترة: {periodLabel}</Text>
        </View>

        <View style={styles.section} minPresenceAhead={130}>
          <Text style={styles.sectionTitle}>نظرة عامة (بيانات تجريبية)</Text>
          <Text style={styles.sectionPeriod}>الفترة: {periodLabel}</Text>
          <View style={styles.kpiGrid}>
            {DUMMY_KPIS.map((kpi) => {
              const content = (
                <>
                  <View style={styles.kpiIconRow}>
                    <View style={styles.kpiIconBadge}>
                      <PdfIcon name={kpi.icon} size={11} color={ACCENT} />
                    </View>
                    <Text style={styles.kpiLabel}>{kpi.label}</Text>
                  </View>
                  <Text style={styles.kpiValue}>
                    {kpi.value}
                    {kpi.suffix ? ` ${kpi.suffix}` : ""}
                  </Text>
                </>
              );
              return kpi.linkTo ? (
                <Link key={kpi.key} src={`#${kpi.linkTo}`} style={styles.kpiCard}>
                  {content}
                </Link>
              ) : (
                <View key={kpi.key} style={styles.kpiCard}>
                  {content}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.divider} />

        <View id="invoices-table" style={styles.section} minPresenceAhead={160}>
          <Text style={styles.sectionTitle}>الفواتير (بيانات تجريبية)</Text>
          <Table
            headers={["رقم الفاتورة", "التاريخ", "الزبون", "الإجمالي", "الحالة", "المتبقي"]}
            rows={DUMMY_INVOICES.map((inv) => [
              inv.number,
              inv.date,
              inv.customer_name,
              `${inv.total_amount} ${inv.currency}`,
              <StatusBadge
                key="status"
                label={INVOICE_STATUS_LABEL[inv.status]}
                variant={INVOICE_STATUS_BADGE_VARIANT[inv.status]}
              />,
              `${inv.balance_due} ${inv.currency}`,
            ])}
          />
        </View>

        <View style={styles.divider} />

        <View id="customers-table" style={styles.section} minPresenceAhead={160}>
          <Text style={styles.sectionTitle}>العملاء (بيانات تجريبية)</Text>
          <Table
            headers={["الاسم", "رقم الهاتف", "التصنيف", "الحالة"]}
            rows={DUMMY_CUSTOMERS.map((c) => [
              c.name,
              c.phone,
              c.category,
              <StatusBadge
                key="status"
                label={c.is_active ? "مفعّل" : "موقوف"}
                variant={c.is_active ? "success" : "secondary"}
              />,
            ])}
          />
        </View>

        <View style={styles.divider} />

        <View id="orders-table" style={styles.section} minPresenceAhead={160}>
          <Text style={styles.sectionTitle}>الطلبات (بيانات تجريبية)</Text>
          <Table
            headers={["الزبون", "الحالة", "عدد الأصناف", "تاريخ الطلب"]}
            rows={DUMMY_ORDERS.map((o) => [
              o.customer_name,
              <StatusBadge
                key="status"
                label={ORDER_STATUS_LABEL[o.status]}
                variant={ORDER_STATUS_BADGE_VARIANT[o.status]}
              />,
              String(o.line_count),
              o.created_at,
            ])}
          />
        </View>

        <View style={styles.footer}>
          {company && (
            <View style={styles.footerBrandRow}>
              {company.logo && (
                // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not a DOM <img>
                <Image src={company.logo} style={styles.footerLogo} />
              )}
              <Text style={styles.footerCompanyName}>{company.name}</Text>
            </View>
          )}
          <Text style={styles.footerDisclaimer}>
            هذا الملف يحتوي على بيانات تجريبية لأغراض الاختبار فقط
          </Text>
        </View>
      </Page>
    </Document>
  );
}
