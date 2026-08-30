"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { useWarehousesQuery } from "../hooks";
import { WarehouseFormDialog } from "./warehouse-form-dialog";

export function RepWarehouseTab({ repId }: { repId: string | number }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = React.useState(false);

  const { data, isLoading } = useWarehousesQuery({ owner_type: "rep" });
  const vans = React.useMemo(
    () => (data?.data?.warehouses ?? []).filter((w) => w.rep === Number(repId)),
    [data, repId],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (vans.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border py-10 text-center">
        <p className="text-sm text-muted-foreground">
          لا يوجد فان مرتبط بهذا المندوب بعد
        </p>
        <PermissionGate module="invoices" requireAction fallback={null}>
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
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

  return (
    <div className="flex flex-col gap-3">
      {vans.map((van) => (
        <div
          key={van.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{van.name}</span>
              <Badge variant={van.is_active ? "success" : "destructive"}>
                {van.is_active ? "نشط" : "موقوف"}
              </Badge>
            </div>
            {(van.address || van.kind) && (
              <span className="text-xs text-muted-foreground">
                {[van.kind, van.address].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/warehouses/detail?id=${van.id}`)}
          >
            عرض المخزون
          </Button>
        </div>
      ))}
    </div>
  );
}
