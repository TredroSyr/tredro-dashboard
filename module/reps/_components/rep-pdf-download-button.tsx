"use client";
import { PdfExportButton } from "@/components/tredro/pdf/pdf-export-button";
import type { Rep, RepOverviewParams } from "../types";
import { fetchRepPdfData } from "../lib/rep-pdf-data";
import { RepProfilePdfDocument } from "./rep-profile-pdf-document";

interface RepPdfDownloadButtonProps {
  rep: Rep;
  /** The period + currency picked in the header, so the PDF matches what's on screen. */
  params: RepOverviewParams;
}

export function RepPdfDownloadButton({ rep, params }: RepPdfDownloadButtonProps) {
  return (
    <PdfExportButton
      fileName={rep.name}
      fetchData={() => fetchRepPdfData(rep.id, params)}
      renderDocument={(data, company) => (
        <RepProfilePdfDocument rep={rep} data={data} company={company} />
      )}
    />
  );
}
