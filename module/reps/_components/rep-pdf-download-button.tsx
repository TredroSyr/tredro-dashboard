"use client";
import * as React from "react";
import { Download } from "lucide-react";
import { pdf } from "@react-pdf/renderer";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/module/auth/store/auth-store";
import type { Rep } from "../types";
import { RepProfilePdfDocument } from "./rep-profile-pdf-document";

interface RepPdfDownloadButtonProps {
  rep: Rep;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function RepPdfDownloadButton({ rep }: RepPdfDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const company = useAuthStore((state) => state.user?.company);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const filename = `rep-profile-${rep.id}.pdf`;
    try {
      try {
        const blob = await pdf(
          <RepProfilePdfDocument rep={rep} company={company} />,
        ).toBlob();
        downloadBlob(blob, filename);
      } catch (err) {
        // Broken/unreachable logo shouldn't block the whole export — retry without it.
        if (!company?.logo) throw err;
        const blob = await pdf(
          <RepProfilePdfDocument
            rep={rep}
            company={{ ...company, logo: null }}
          />,
        ).toBlob();
        downloadBlob(blob, filename);
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
