"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/hooks/use-api-form-error";
import {
  useDeactivateWarehouseMutation,
  useWarehouseProductStockQuery,
  useWarehouseQuery,
} from "../hooks";
import { WarehouseFormDialog } from "./warehouse-form-dialog";
import { WarehousesDataTable } from "./data-table";
import { WarehousesDataTableToolbar } from "./data-table-toolbar";
import {
  createWarehouseStockColumns,
  WarehouseStockProductCell,
  WarehouseLowStockBadge,
} from "./warehouse-stock-columns";
import type { WarehouseProductStockRow } from "../types";

function formatQuantity(value: string) {
  return Number(value).toLocaleString("ar", { maximumFractionDigits: 3 });
}

const STOCK_PAGE_SIZE = 8;

export function WarehouseDetailClient({
  warehouseId,
  context = "warehouse",
}: {
  warehouseId: string;
  /** "rep" hides the breadcrumb/actions and labels the entity as a rep's car instead of a warehouse. */
  context?: "warehouse" | "rep";
}) {
  const isRepContext = context === "rep";
  const entityLabel = isRepContext ? "السيارة" : "المستودع";
  const { data, isLoading, isError, refetch } = useWarehouseQuery(warehouseId);
  const warehouse = data?.data?.warehouse;

  const { data: stockData, isLoading: isLoadingStock } =
    useWarehouseProductStockQuery(warehouseId, { enabled: Boolean(warehouse) });
  const allStock = stockData?.data?.stock ?? [];
  const stockColumns = React.useMemo(() => createWarehouseStockColumns(), []);

  const [stockSearch, setStockSearch] = React.useState("");
  const [stockPage, setStockPage] = React.useState(1);

  // The stock endpoint isn't paginated server-side — filter and page the list ourselves.
  const filteredStock = React.useMemo(() => {
    const q = stockSearch.trim().toLowerCase();
    if (!q) return allStock;
    return allStock.filter(
      (row) =>
        row.product_name.toLowerCase().includes(q) ||
        row.product_sku.toLowerCase().includes(q) ||
        row.product_barcode.toLowerCase().includes(q),
    );
  }, [allStock, stockSearch]);

  const stockTotalPages = Math.max(
    1,
    Math.ceil(filteredStock.length / STOCK_PAGE_SIZE),
  );
  const stock = React.useMemo(() => {
    const start = (stockPage - 1) * STOCK_PAGE_SIZE;
    return filteredStock.slice(start, start + STOCK_PAGE_SIZE);
  }, [filteredStock, stockPage]);

  const handleStockSearchChange = (value: string) => {
    setStockSearch(value);
    setStockPage(1);
  };

  const [editOpen, setEditOpen] = React.useState(false);
  const [deactivateOpen, setDeactivateOpen] = React.useState(false);
  const { mutate: deactivateWarehouse, isPending: isDeactivating } =
    useDeactivateWarehouseMutation();

  if (isError) {
    return (
      <div className="px-6 py-8">
        <ErrorDisplay
          title={`حدث خطأ أثناء تحميل بيانات ${entityLabel}`}
          message="يرجى التحقق من الاتصال بالإنترنت وإعادة المحاولة"
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!isLoading && !warehouse) {
    return (
      <div className="px-6 py-8">
        <ErrorDisplay
          title={isRepContext ? "السيارة غير موجودة" : "المستودع غير موجود"}
          message={
            isRepContext
              ? "السيارة التي تحاول الوصول إليها غير موجودة أو تم حذفها"
              : "المستودع الذي تحاول الوصول إليه غير موجود أو تم حذفه"
          }
        />
      </div>
    );
  }

  return (
    <div>
      {!isRepContext && (
        <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-6 sm:py-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/home">الرئيسية</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/warehouses">المستودعات</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <BreadcrumbPage>{warehouse?.name}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {isLoading || !warehouse ? (
                  <Skeleton className="h-7 w-40" />
                ) : (
                  <>
                    <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                      {warehouse.name}
                    </h1>
                    <Badge
                      variant={warehouse.is_active ? "success" : "destructive"}
                    >
                      {warehouse.is_active ? "نشط" : "موقوف"}
                    </Badge>
                  </>
                )}
              </div>
              {isLoading || !warehouse ? (
                <Skeleton className="h-4 w-56" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {warehouse.owner_type === "company"
                    ? "مستودع الشركة"
                    : `فان — ${warehouse.rep_name}`}
                  {warehouse.address && ` · ${warehouse.address}`}
                </p>
              )}
              {!isLoading && warehouse && !isLoadingStock && (
                <Badge className="font-normal">{allStock.length} منتج</Badge>
              )}
            </div>

            <PermissionGate module="invoices" requireAction fallback={null}>
              {!isLoading && warehouse && (
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditOpen(true)}
                  >
                    <IconRenderer name="edit_outlined" className="size-4" />
                    تعديل
                  </Button>
                  {warehouse.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeactivateOpen(true)}
                    >
                      إيقاف
                    </Button>
                  )}
                </div>
              )}
            </PermissionGate>
          </div>
        </div>
      )}

      <div className="flex flex-col px-4 py-5 sm:px-6">
        <WarehousesDataTable
          columns={stockColumns}
          data={stock}
          isLoading={isLoadingStock}
          pagination={{ page: stockPage, totalPages: stockTotalPages }}
          onPageChange={setStockPage}
          emptyState={
            <div className="flex w-full flex-col items-center justify-center px-6 py-10 text-center text-sm text-muted-foreground">
              {stockSearch
                ? "لا توجد أصناف مطابقة لهذا البحث"
                : `لا توجد أي كمية مسجّلة بعد في ${
                    isRepContext ? "هذه السيارة" : "هذا المستودع"
                  }`}
            </div>
          }
          renderMobileCard={(row: WarehouseProductStockRow) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <WarehouseStockProductCell row={row} />
                <WarehouseLowStockBadge row={row} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  الكمية:{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {formatQuantity(row.quantity)} {row.unit_name}
                  </span>
                </span>
                <span>
                  حد الطلب:{" "}
                  <span className="tabular-nums">
                    {row.reorder_point
                      ? formatQuantity(row.reorder_point)
                      : "—"}
                  </span>
                </span>
              </div>
            </div>
          )}
        />
      </div>

      {warehouse && (
        <WarehouseFormDialog
          warehouse={warehouse}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}

      {warehouse && (
        <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>إيقاف المستودع</AlertDialogTitle>
              <AlertDialogDescription>
                سيتوقف "{warehouse.name}" عن الظهور كخيار عند إنشاء فواتير أو
                تحويلات جديدة، ولن يُحذف سجله أو مخزونه السابق.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>تراجع</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeactivating}
                onClick={() =>
                  deactivateWarehouse(warehouse.id, {
                    onSuccess: () => setDeactivateOpen(false),
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
