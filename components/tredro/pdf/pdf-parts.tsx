"use client";

import * as React from "react";
import { View, Text, Image, Link, StyleSheet, Font } from "@react-pdf/renderer";
import { PdfIcon } from "./pdf-icons";
import {
  PDF_BADGE_COLORS,
  type PdfKpi,
  type PdfTableData,
} from "./pdf-utils";

Font.register({
  family: "Thmanyah",
  fonts: [
    { src: "/fonts/thmanyah/thmanyahsans-Regular.woff2", fontWeight: 400 },
    { src: "/fonts/thmanyah/thmanyahsans-Medium.woff2", fontWeight: 500 },
    { src: "/fonts/thmanyah/thmanyahsans-Bold.woff2", fontWeight: 700 },
  ],
});

export const PDF_ACCENT = "#2563EB";

export interface PdfCompany {
  name: string;
  logo?: string | null;
}

export const pdfStyles = StyleSheet.create({
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
  identityRow: {
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
  identityName: {
    fontSize: 17,
    fontWeight: 700,
    textAlign: "center",
    textDecoration: "none",
    color: "#111827",
  },
  phoneLink: {
    fontSize: 10.5,
    color: PDF_ACCENT,
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
    backgroundColor: PDF_ACCENT,
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
  tableNote: {
    fontSize: 8,
    color: "#6B7280",
    marginTop: 4,
  },
  emptyRow: {
    padding: 10,
    fontSize: 9,
    color: "#6B7280",
    textAlign: "center",
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
});

export function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: keyof typeof PDF_BADGE_COLORS;
}) {
  const color = PDF_BADGE_COLORS[variant];
  return (
    <View style={[pdfStyles.statusBadge, { backgroundColor: color.bg }]}>
      <Text style={[pdfStyles.statusBadgeText, { color: color.text }]}>{label}</Text>
    </View>
  );
}

export function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <View style={pdfStyles.table}>
      <View style={pdfStyles.tableHeaderRow}>
        {headers.map((h, i) => (
          <Text key={i} style={pdfStyles.headerCell}>
            {h}
          </Text>
        ))}
      </View>
      {rows.length === 0 && <Text style={pdfStyles.emptyRow}>لا توجد بيانات</Text>}
      {rows.map((row, ri) => (
        <View
          key={ri}
          wrap={false}
          style={ri === rows.length - 1 ? pdfStyles.tableRowLast : pdfStyles.tableRow}
        >
          {row.map((cell, ci) => (
            <View key={ci} style={pdfStyles.cell}>
              {typeof cell === "string" ? (
                <Text style={pdfStyles.cellText}>{cell}</Text>
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

/** Says so when the table holds only the latest rows of a longer list. */
export function TableNote({ table }: { table: PdfTableData<unknown> }) {
  if (table.total <= table.rows.length) return null;
  return (
    <Text style={pdfStyles.tableNote}>
      يعرض أحدث {table.rows.length} من أصل {table.total}
    </Text>
  );
}

export function PdfDivider() {
  return <View style={pdfStyles.divider} />;
}

/** Company brand, the subject's name (status dot + link to top), phone and the period covered. */
export function PdfHeader({
  company,
  name,
  phone,
  isActive,
  periodLabel,
}: {
  company?: PdfCompany | null;
  name: string;
  phone: string;
  isActive: boolean;
  periodLabel: string;
}) {
  return (
    <View id="doc-top" style={pdfStyles.headerBlock}>
      {company && (
        <View style={pdfStyles.companyRow}>
          {company.logo && (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not a DOM <img>
            <Image src={company.logo} style={pdfStyles.companyLogo} />
          )}
          <Text style={pdfStyles.companyName}>{company.name}</Text>
        </View>
      )}
      <View style={pdfStyles.identityRow}>
        <View
          style={[
            pdfStyles.statusDot,
            { backgroundColor: isActive ? "#16A34A" : "#9CA3AF" },
          ]}
        />
        <Link src="#doc-top" style={pdfStyles.identityName}>
          {name}
        </Link>
      </View>
      <Link src={`tel:${phone}`} style={pdfStyles.phoneLink}>
        {phone}
      </Link>
      <Text style={pdfStyles.headerPeriod}>الفترة: {periodLabel}</Text>
    </View>
  );
}

/** The "overview" KPI cards; a card with `linkTo` jumps to that section's anchor. */
export function PdfKpiSection({
  kpis,
  periodLabel,
}: {
  kpis: PdfKpi[];
  periodLabel: string;
}) {
  return (
    <View style={pdfStyles.section} minPresenceAhead={130}>
      <Text style={pdfStyles.sectionTitle}>نظرة عامة</Text>
      <Text style={pdfStyles.sectionPeriod}>الفترة: {periodLabel}</Text>
      <View style={pdfStyles.kpiGrid}>
        {kpis.map((kpi) => {
          const content = (
            <>
              <View style={pdfStyles.kpiIconRow}>
                <View style={pdfStyles.kpiIconBadge}>
                  <PdfIcon name={kpi.icon} size={11} color={PDF_ACCENT} />
                </View>
                <Text style={pdfStyles.kpiLabel}>{kpi.label}</Text>
              </View>
              <Text style={pdfStyles.kpiValue}>
                {kpi.value}
                {kpi.suffix ? ` ${kpi.suffix}` : ""}
              </Text>
            </>
          );
          return kpi.linkTo ? (
            <Link key={kpi.key} src={`#${kpi.linkTo}`} style={pdfStyles.kpiCard}>
              {content}
            </Link>
          ) : (
            <View key={kpi.key} style={pdfStyles.kpiCard}>
              {content}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function PdfFooter({ company }: { company?: PdfCompany | null }) {
  return (
    <View style={pdfStyles.footer}>
      {company && (
        <View style={pdfStyles.footerBrandRow}>
          {company.logo && (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not a DOM <img>
            <Image src={company.logo} style={pdfStyles.footerLogo} />
          )}
          <Text style={pdfStyles.footerCompanyName}>{company.name}</Text>
        </View>
      )}
    </View>
  );
}
