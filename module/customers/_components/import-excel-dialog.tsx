"use client";
import * as React from "react";
import {
  Download,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  XCircle,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { downloadCustomersTemplate } from "../api";
import { useImportCustomersExcelMutation } from "../hooks";
import { ImportExcelResult } from "../types";

export function ImportExcelDialog() {
  const [open, setOpen] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [result, setResult] = React.useState<ImportExcelResult | null>(null);
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
    importExcel(file, {
      onSuccess: (res) => setResult(res.data),
    });
    e.target.value = "";
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileSpreadsheet className="size-4" />
          استيراد Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right">
            استيراد العملاء من Excel
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 rounded-md border border-border p-3 text-right">
              <p className="text-sm text-muted-foreground">
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
            <div className="flex items-center gap-3 justify-center">
              <Badge variant="default" className="gap-1.5">
                <CheckCircle2 className="size-3.5" />
                {result.successful} نجح
              </Badge>
              {result.failed > 0 && (
                <Badge variant="destructive" className="gap-1.5">
                  <XCircle className="size-3.5" />
                  {result.failed} فشل
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                من أصل {result.total_rows} صف
              </span>
            </div>

            {result.errors.length > 0 && (
              <ScrollArea className="h-64 rounded-md border border-border p-3">
                <div className="flex flex-col gap-3">
                  {result.errors.map((err) => (
                    <div
                      key={err.row}
                      className="text-sm border-b border-border pb-2 last:border-0 text-right"
                    >
                      <span className="font-medium text-foreground">
                        صف {err.row}
                      </span>
                      <div className="flex flex-col gap-0.5 mt-1">
                        {Object.entries(err.errors).map(([field, msgs]) => (
                          <span
                            key={field}
                            className="text-destructive text-xs"
                          >
                            {field}: {msgs.join("، ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <Button variant="outline" onClick={() => setResult(null)}>
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
