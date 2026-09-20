"use client";
import * as React from "react";
import { Download } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/module/auth/store/auth-store";
import type { Company } from "@/module/auth/types";

interface PdfExportButtonProps<T> {
  /** Download name without the extension — the subject's own name. */
  fileName: string;
  /** Runs on click, so the data is only fetched when someone actually exports. */
  fetchData: () => Promise<T>;
  renderDocument: (data: T, company: Company | null | undefined) => React.ReactElement;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function downloadBlob(blob: Blob, filename: string) {
  // `<a download>` on a blob URL is ignored by the Android/iOS WebView, so inside the app
  // write the file to the app cache (no storage permission needed) and hand it to the
  // system share sheet, where the user can save it to Files/Drive or open it in a PDF viewer.
  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data: await blobToBase64(blob),
      directory: Directory.Cache,
    });
    try {
      await Share.share({ title: filename, url: uri, dialogTitle: filename });
    } catch {
      // Dismissing the share sheet rejects — that's not a failure.
    }
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function PdfExportButton<T>({
  fileName,
  fetchData,
  renderDocument,
}: PdfExportButtonProps<T>) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const company = useAuthStore((state) => state.user?.company);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Strip characters that are invalid in filenames; fall back to a generic name if nothing usable is left.
    const safeName = fileName.replace(/[\\/:*?"<>|]/g, "").trim();
    const filename = `${safeName || "profile"}.pdf`;
    try {
      const data = await fetchData();
      try {
        const blob = await pdf(renderDocument(data, company)).toBlob();
        await downloadBlob(blob, filename);
      } catch (err) {
        // Broken/unreachable logo shouldn't block the whole export — retry without it.
        if (!company?.logo) throw err;
        const blob = await pdf(renderDocument(data, { ...company, logo: null })).toBlob();
        await downloadBlob(blob, filename);
      }
    } catch {
      toast.error("تعذّر إنشاء ملف PDF، يرجى المحاولة مرة أخرى");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="shrink-0 gap-1.5 sm:w-auto sm:px-3"
      onClick={handleGenerate}
      disabled={isGenerating}
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">
        {isGenerating ? "جارٍ التصدير..." : "تصدير PDF"}
      </span>
    </Button>
  );
}
