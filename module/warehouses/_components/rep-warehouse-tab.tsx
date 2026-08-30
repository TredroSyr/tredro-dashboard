"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { useWarehousesQuery } from "../hooks";
import { WarehouseFormDialog } from "./warehouse-form-dialog";
import { WarehouseDetailClient } from "./warehouse-detail-client";

export function RepWarehouseTab({ repId }: { repId: string | number }) {
  const [addOpen, setAddOpen] = React.useState(false);

  const { data, isLoading } = useWarehousesQuery({ owner_type: "rep" });
  // Every rep has exactly one warehouse (their van/car).
  const van = React.useMemo(
    () => (data?.data?.warehouses ?? []).find((w) => w.rep === Number(repId)),
    [data, repId],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!van) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border py-10 text-center">
        <p className="text-sm text-muted-foreground">
          لا يوجد فان مرتبط بهذا المندوب بعد
        </p>
        <PermissionGate module="invoices" requireAction fallback={null}>
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <IconRenderer name="plus_outlined" className="size-4" />
            إضافة فان
          </Button>
        </PermissionGate>

        <WarehouseFormDialog
          warehouse={null}
          open={addOpen}
          onOpenChange={setAddOpen}
          lockOwnerType="rep"
          lockRep={Number(repId)}
        />
      </div>
    );
  }

  return <WarehouseDetailClient warehouseId={String(van.id)} context="rep" />;
}
