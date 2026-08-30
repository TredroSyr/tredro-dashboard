"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/hooks/use-api-form-error";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { WarehousesDataTable } from "./data-table";
import { createWarehouseColumns } from "./warehouse-columns";
import { WarehouseFormDialog } from "./warehouse-form-dialog";
import { useDeactivateWarehouseMutation, useWarehousesQuery } from "../hooks";
import type { Warehouse } from "../types";

const STATUS_OPTIONS: { value: "all" | "true" | "false"; label: string }[] = [
  { value: "all", label: "كل الحالات" },
  { value: "true", label: "نشط" },
  { value: "false", label: "موقوف" },
];

export default function WarehousesView() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [isActive, setIsActive] = React.useState<"all" | "true" | "false">("all");
  const [formTarget, setFormTarget] = React.useState<Warehouse | null | undefined>(
    undefined,
  );
  const [deactivateTarget, setDeactivateTarget] = React.useState<Warehouse | null>(
    null,
  );

  // Rep vans are managed from each rep's own page — this screen only shows company warehouses.
  const { data, isLoading, isError, error, refetch } = useWarehousesQuery({
    owner_type: "company",
    is_active: isActive === "all" ? undefined : isActive === "true",
  });

  const allWarehouses = data?.data?.warehouses ?? [];
  const warehouses = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allWarehouses;
    return allWarehouses.filter((w) => w.name.toLowerCase().includes(q));
  }, [allWarehouses, search]);

  const hasActiveFilters = Boolean(search.trim()) || isActive !== "all";

  const { mutate: deactivateWarehouse, isPending: isDeactivating } =
    useDeactivateWarehouseMutation();

  const goToDetail = (warehouse: Warehouse) =>
    router.push(`/warehouses/detail?id=${warehouse.id}`);

  const columns = React.useMemo(
    () =>
      createWarehouseColumns({
        onEdit: setFormTarget,
        onViewStock: goToDetail,
        onDeactivate: setDeactivateTarget,
      }),
    [],
  );

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              المستودعات
            </h1>
            <p className="text-sm text-muted-foreground">
              مستودعات الشركة ومخزون كل منها — فان كل مندوب يُدار من صفحته الخاصة
            </p>
          </div>
          <PermissionGate module="invoices" requireAction fallback={null}>
            <Button size="sm" className="gap-1.5" onClick={() => setFormTarget(null)}>
              <Plus className="size-4" />
              مستودع جديد
            </Button>
          </PermissionGate>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full xs:w-[220px] sm:w-[260px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="ابحث باسم المستودع..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>

          <SearchableSelect
            hideSearch
            options={STATUS_OPTIONS}
            value={isActive}
            onChange={(v) => setIsActive(v as "all" | "true" | "false")}
            className="h-8 w-[140px] rounded-lg"
          />

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setIsActive("all");
              }}
              className="gap-1 text-muted-foreground"
            >
              <X className="size-4" />
              مسح الفلاتر
            </Button>
          )}

          {!isLoading && (
            <Badge className="font-normal">{warehouses.length} مستودع</Badge>
          )}
        </div>

        <WarehousesDataTable
          columns={columns}
          data={warehouses}
          isLoading={isLoading}
          isError={isError}
          errorMessage={
            error instanceof Error ? error.message : "حدث خطأ أثناء تحميل المستودعات"
          }
          onRetry={() => refetch()}
          onRowClick={goToDetail}
          renderMobileCard={(w: Warehouse) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">{w.name}</p>
                  <p className="text-xs text-muted-foreground">{w.kind || "—"}</p>
                </div>
                <Badge variant={w.is_active ? "success" : "destructive"}>
                  {w.is_active ? "نشط" : "موقوف"}
                </Badge>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToDetail(w);
                  }}
                >
                  عرض المخزون
                </Button>
                <PermissionGate module="invoices" requireAction fallback={null}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormTarget(w);
                    }}
                  >
                    تعديل
                  </Button>
                  {w.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeactivateTarget(w);
                      }}
                    >
                      إيقاف
                    </Button>
                  )}
                </PermissionGate>
              </div>
            </div>
          )}
          emptyState={
            <div className="flex w-full flex-col items-center justify-center px-6 py-10 text-center text-sm text-muted-foreground">
              {hasActiveFilters ? "لا توجد مستودعات مطابقة" : "لا توجد مستودعات بعد"}
            </div>
          }
        />
      </div>

      <WarehouseFormDialog
        warehouse={formTarget ?? null}
        open={formTarget !== undefined}
        onOpenChange={(open) => !open && setFormTarget(undefined)}
        lockOwnerType="company"
      />

      {deactivateTarget && (
        <AlertDialog open onOpenChange={(open: boolean) => !open && setDeactivateTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>إيقاف المستودع</AlertDialogTitle>
              <AlertDialogDescription>
                سيتوقف "{deactivateTarget.name}" عن الظهور كخيار عند إنشاء فواتير أو
                تحويلات جديدة، ولن يُحذف سجله أو مخزونه السابق.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>تراجع</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeactivating}
                onClick={() =>
                  deactivateWarehouse(deactivateTarget.id, {
                    onSuccess: () => setDeactivateTarget(null),
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  })
                }
              >
                {isDeactivating ? "جارٍ الإيقاف..." : "إيقاف المستودع"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
