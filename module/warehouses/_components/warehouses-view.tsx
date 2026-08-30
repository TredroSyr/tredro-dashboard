"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/hooks/use-api-form-error";
import { IconRenderer } from "@/assets/icons/iconRenderer";
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
import { WarehousesDataTableToolbar } from "./data-table-toolbar";
import { createWarehouseColumns } from "./warehouse-columns";
import { WarehouseFormDialog } from "./warehouse-form-dialog";
import { useDeactivateWarehouseMutation, useWarehousesQuery } from "../hooks";
import type { Warehouse } from "../types";

const STATUS_OPTIONS: { value: "all" | "true" | "false"; label: string }[] = [
  { value: "all", label: "كل الحالات" },
  { value: "true", label: "نشط" },
  { value: "false", label: "موقوف" },
];

const PAGE_SIZE = 8;

export default function WarehousesView() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [isActive, setIsActive] = React.useState<"all" | "true" | "false">("all");
  const [page, setPage] = React.useState(1);
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
  const filteredWarehouses = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allWarehouses;
    return allWarehouses.filter((w) => w.name.toLowerCase().includes(q));
  }, [allWarehouses, search]);

  // The warehouses endpoint isn't paginated server-side (frontend2.md §6) — page the filtered list ourselves.
  const totalPages = Math.max(1, Math.ceil(filteredWarehouses.length / PAGE_SIZE));
  const warehouses = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredWarehouses.slice(start, start + PAGE_SIZE);
  }, [filteredWarehouses, page]);

  const hasActiveFilters = Boolean(search.trim()) || isActive !== "all";

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: "all" | "true" | "false") => {
    setIsActive(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setIsActive("all");
    setPage(1);
  };

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
    <div className="flex flex-col px-4 py-5 sm:px-6">
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
        pagination={{ page, totalPages }}
        onPageChange={setPage}
        toolbar={
          <WarehousesDataTableToolbar
            title="المستودعات"
            totalLabel="مستودع"
            total={filteredWarehouses.length}
            search={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="ابحث باسم المستودع..."
            actions={
              <>
                <SearchableSelect
                  hideSearch
                  options={STATUS_OPTIONS}
                  value={isActive}
                  onChange={(v) => handleStatusChange(v as "all" | "true" | "false")}
                  className="h-9 w-[140px] rounded-lg"
                />
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-1 text-muted-foreground"
                  >
                    <IconRenderer name="close_outlined" className="size-4" />
                    مسح الفلاتر
                  </Button>
                )}
                <PermissionGate module="invoices" requireAction fallback={null}>
                  <Button size="sm" className="gap-1.5" onClick={() => setFormTarget(null)}>
                    <IconRenderer name="plus_outlined" className="size-4" />
                    مستودع جديد
                  </Button>
                </PermissionGate>
              </>
            }
          />
        }
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
