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

function formatQuantity(value: string) {
  return Number(value).toLocaleString("ar", { maximumFractionDigits: 3 });
}

export function WarehouseDetailClient({ warehouseId }: { warehouseId: string }) {
  const { data, isLoading, isError, refetch } = useWarehouseQuery(warehouseId);
  const warehouse = data?.data?.warehouse;

  const { data: stockData, isLoading: isLoadingStock } =
    useWarehouseProductStockQuery(warehouseId, { enabled: Boolean(warehouse) });
  const stock = stockData?.data?.stock ?? [];

  const [editOpen, setEditOpen] = React.useState(false);
  const [deactivateOpen, setDeactivateOpen] = React.useState(false);
  const { mutate: deactivateWarehouse, isPending: isDeactivating } =
    useDeactivateWarehouseMutation();

  if (isError) {
    return (
      <div className="px-6 py-8">
        <ErrorDisplay
          title="حدث خطأ أثناء تحميل بيانات المستودع"
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
          title="المستودع غير موجود"
          message="المستودع الذي تحاول الوصول إليه غير موجود أو تم حذفه"
        />
      </div>
    );
  }

  return (
    <div>
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
                  <Badge variant={warehouse.is_active ? "success" : "destructive"}>
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
                {warehouse.kind && ` · ${warehouse.kind}`}
              </p>
            )}
          </div>

          <PermissionGate module="invoices" requireAction fallback={null}>
            {!isLoading && warehouse && (
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
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

      <div className="flex flex-col gap-3 px-4 py-5 sm:px-6">
        <h2 className="text-sm font-semibold text-foreground sm:text-base">
          المخزون الحالي
        </h2>

        {isLoadingStock ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : stock.length === 0 ? (
          <p className="rounded-xl border border-border py-10 text-center text-sm text-muted-foreground">
            لا توجد أي كمية مسجّلة بعد في هذا المستودع
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-right text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">الصنف</th>
                  <th className="px-4 py-2.5 font-medium">الكمية المتوفرة</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 text-foreground">
                      {row.product_name}
                      {row.product_sku && (
                        <span className="ms-1.5 text-xs text-muted-foreground">
                          ({row.product_sku})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium text-foreground">
                      {formatQuantity(row.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
