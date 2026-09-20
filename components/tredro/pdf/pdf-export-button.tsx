"use client";
import * as React from "react";
import { Download } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { Capacitor, registerPlugin } from "@capacitor/core";

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

interface FileSaverPlugin {
  saveToDownloads(options: {
    fileName: string;
    data: string;
    mimeType: string;
  }): Promise<{ fileName: string }>;
}

// Local Android plugin (android/.../FileSaverPlugin.java).
const FileSaver = registerPlugin<FileSaverPlugin>("FileSaver");

async function downloadBlob(blob: Blob, filename: string) {
  // `<a download>` on a blob URL is ignored by the Android WebView, so inside the app the
  // file is written straight into the device's Downloads folder by the native plugin.
  if (Capacitor.isNativePlatform()) {
    const { fileName } = await FileSaver.saveToDownloads({
      fileName: filename,
      data: await blobToBase64(blob),
      mimeType: blob.type || "application/pdf",
    });
    toast.success(`تم حفظ الملف في مجلد التنزيلات: ${fileName}`);
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
