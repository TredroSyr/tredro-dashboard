"use client";
import * as React from "react";
import * as XLSX from "xlsx";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImportError } from "../types";
import { useImportCustomersExcelMutation } from "../hooks";

interface EditableRow {
  row: number;
  name: string;
  phone: string;
  email: string;
  assigned_rep_codes: string;
  errors: Record<string, string[]>;
}

interface FailedRowsEditorProps {
  errors: ImportError[];
  onRetryComplete: (result: any) => void;
  onRetryError?: (err: any) => void;
}

export function FailedRowsEditor({
  errors,
  onRetryComplete,
  onRetryError,
}: FailedRowsEditorProps) {
  const [rows, setRows] = React.useState<EditableRow[]>(() =>
    errors.map((e) => ({
      row: e.row,
      name: (e.data.name as string) ?? "",
      phone: (e.data.phone as string) ?? "",
      email: (e.data.email as string) ?? "",
      assigned_rep_codes: (e.data.assigned_rep_codes as string) ?? "",
      errors: e.errors,
    })),
  );

  React.useEffect(() => {
    setRows(
      errors.map((e) => ({
        row: e.row,
        name: (e.data.name as string) ?? "",
        phone: (e.data.phone as string) ?? "",
        email: (e.data.email as string) ?? "",
        assigned_rep_codes: (e.data.assigned_rep_codes as string) ?? "",
        errors: e.errors,
      })),
    );
  }, [errors]);

  const { mutate: importExcel, isPending } = useImportCustomersExcelMutation();

  const updateRow = (row: number, field: keyof EditableRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.row === row ? { ...r, [field]: value } : r)),
    );
  };

  const handleRetry = () => {
    const worksheetData = [
      ["الاسم *", "رقم الهاتف *", "البريد الإلكتروني", "أكواد المندوبين"],
      ...rows.map((r) => [r.name, r.phone, r.email, r.assigned_rep_codes]),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

    const arrayBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const file = new File([arrayBuffer], "retry_failed_customers.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    importExcel(file, {
      onSuccess: (res) => onRetryComplete(res.data),
      onError: (err) => onRetryError?.(err),
    });
  };

  const fieldHasError = (row: EditableRow, field: string) =>
    Object.keys(row.errors).includes(field);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="p-2 text-right font-normal text-muted-foreground">
                صف
              </th>
              <th className="p-2 text-right font-normal text-muted-foreground">
                الاسم
              </th>
              <th className="p-2 text-right font-normal text-muted-foreground">
                الهاتف
              </th>
              <th className="p-2 text-right font-normal text-muted-foreground">
                البريد
              </th>
              <th className="p-2 text-right font-normal text-muted-foreground">
                أكواد المندوبين
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.row}
                className="border-b border-border last:border-0"
              >
                <td className="p-2 font-normal text-muted-foreground">
                  {row.row}
                </td>
                <td className="p-2">
                  <Input
                    value={row.name}
                    onChange={(e) => updateRow(row.row, "name", e.target.value)}
                    className={
                      fieldHasError(row, "name")
                        ? "h-8 border-destructive text-sm font-normal"
                        : "h-8 text-sm font-normal"
                    }
                  />
                  {fieldHasError(row, "name") && (
                    <span className="text-xs font-normal text-destructive block mt-0.5">
                      {row.errors.name.join("، ")}
                    </span>
                  )}
                </td>
                <td className="p-2">
                  <Input
                    value={row.phone}
                    dir="ltr"
                    onChange={(e) =>
                      updateRow(row.row, "phone", e.target.value)
                    }
                    className={
                      fieldHasError(row, "phone")
                        ? "h-8 border-destructive text-sm font-normal"
                        : "h-8 text-sm font-normal"
                    }
                  />
                  {fieldHasError(row, "phone") && (
                    <span className="text-xs font-normal text-destructive block mt-0.5">
                      {row.errors.phone.join("، ")}
                    </span>
                  )}
                </td>
                <td className="p-2">
                  <Input
                    value={row.email}
                    dir="ltr"
                    onChange={(e) =>
                      updateRow(row.row, "email", e.target.value)
                    }
                    className={
                      fieldHasError(row, "email")
                        ? "h-8 border-destructive text-sm font-normal"
                        : "h-8 text-sm font-normal"
                    }
                  />
                  {fieldHasError(row, "email") && (
                    <span className="text-xs font-normal text-destructive block mt-0.5">
                      {row.errors.email.join("، ")}
                    </span>
                  )}
                </td>
                <td className="p-2">
                  <Input
                    value={row.assigned_rep_codes}
                    dir="ltr"
                    placeholder="REP001,REP002"
                    onChange={(e) =>
                      updateRow(row.row, "assigned_rep_codes", e.target.value)
                    }
                    className={
                      fieldHasError(row, "assigned_rep_codes")
                        ? "h-8 border-destructive text-sm font-normal"
                        : "h-8 text-sm font-normal"
                    }
                  />
                  {fieldHasError(row, "assigned_rep_codes") && (
                    <span className="text-xs font-normal text-destructive block mt-0.5">
                      {row.errors.assigned_rep_codes.join("، ")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button onClick={handleRetry} disabled={isPending} className="self-start">
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RefreshCw className="size-4" />
        )}
        إعادة محاولة استيراد الصفوف المعدّلة
      </Button>
    </div>
  );
}
