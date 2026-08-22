"use client";
import * as React from "react";
import {
  Download,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { downloadCustomersTemplate } from "../api";
import { useImportCustomersExcelMutation } from "../hooks";
import { ImportExcelResult } from "../types";
import { FailedRowsEditor } from "./failed-rows-editor";

export function ImportExcelDialog() {
  const [open, setOpen] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [result, setResult] = React.useState<ImportExcelResult | null>(null);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { mutate: importExcel, isPending: isImporting } =
    useImportCustomersExcelMutation();

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const blob = await downloadCustomersTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "customers_import_template.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setGeneralError(null);
    importExcel(file, {
      onSuccess: (res) => setResult(res.data),
      onError: (err: any) => {
        const responseData = err?.response?.data;
        const details = responseData?.errors?.details;
        if (details) {
          setResult(details);
          setGeneralError(responseData?.message ?? null);
        } else {
          setGeneralError(responseData?.message ?? "حدث خطأ أثناء الاستيراد");
        }
      },
    });
    e.target.value = "";
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) {
      setResult(null);
      setGeneralError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileSpreadsheet className="size-4" />
          استيراد Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">
            استيراد العملاء من Excel
          </DialogTitle>
        </DialogHeader>

        {!result && !generalError ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 rounded-md border border-border p-3 text-right">
              <p className="text-sm font-normal text-muted-foreground">
                حمّل القالب أولاً، عبّئ بيانات العملاء، ثم ارفع الملف. الصفوف
                غير الصحيحة تُستثنى مع تقرير مفصّل، بينما تُستورد بقية الصفوف
                بنجاح.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                disabled={isDownloading}
                className="self-start"
              >
                <Download className="size-4" />
                {isDownloading ? "جارٍ التحميل..." : "تحميل القالب"}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="h-12"
            >
              <Upload className="size-4" />
              {isImporting ? "جارٍ الاستيراد..." : "اختيار ملف الاستيراد"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {generalError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-right">
                <AlertTriangle className="size-4 shrink-0 text-destructive mt-0.5" />
                <span className="text-sm font-normal text-destructive">
                  {generalError}
                </span>
              </div>
            )}

            {result && (
              <>
                <div className="flex items-center gap-3 justify-center flex-wrap">
                  <Badge variant="default" className="gap-1.5 font-normal">
                    <CheckCircle2 className="size-3.5" />
                    {result.successful} نجح
                  </Badge>
                  {result.failed > 0 && (
                    <Badge
                      variant="destructive"
                      className="gap-1.5 font-normal"
                    >
                      <XCircle className="size-3.5" />
                      {result.failed} فشل
                    </Badge>
                  )}
                  <span className="text-sm font-normal text-muted-foreground">
                    من أصل {result.total_rows} صف
                  </span>
                </div>

                {result.errors.length > 0 && (
                  <FailedRowsEditor
                    errors={result.errors}
                    onRetryComplete={(res) => {
                      setResult(res);
                      setGeneralError(null);
                    }}
                    onRetryError={(err: any) => {
                      const responseData = err?.response?.data;
                      const details = responseData?.errors?.details;
                      if (details) {
                        setResult(details);
                        setGeneralError(responseData?.message ?? null);
                      } else {
                        setGeneralError(
                          responseData?.message ??
                            "حدث خطأ أثناء إعادة المحاولة",
                        );
                      }
                    }}
                  />
                )}
              </>
            )}

            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setGeneralError(null);
              }}
            >
              استيراد ملف آخر
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
