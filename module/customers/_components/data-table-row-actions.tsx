"use client";
import * as React from "react";
import { Ban, Pencil } from "lucide-react";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Customer } from "../types";
import { useDeactivateCustomerMutation } from "../hooks";
import { CustomerFormDrawer } from "./actions-drawer";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const item = row.original as Customer;

  const [deactivateDialogOpen, setDeactivateDialogOpen] = React.useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = React.useState(false);

  const { mutate: deactivateCustomer, isPending: isDeactivating } =
    useDeactivateCustomerMutation();

  return (
    <>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setEditDrawerOpen(true)}
        >
          <Pencil className="size-4 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeactivateDialogOpen(true)}
          disabled={!item.is_active}
        >
          <Ban className="size-4 text-destructive" />
        </Button>
      </div>

      <CustomerFormDrawer
        mode="edit"
        customerId={item.id}
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
      />

      <Dialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">تعطيل العميل</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-right">
            هل أنت متأكد من تعطيل{" "}
            <span className="font-medium text-foreground">{item.name}</span>؟
            سيتم إيقاف حسابه مع الاحتفاظ بسجل طلباته وبياناته.
          </p>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              variant="destructive"
              disabled={isDeactivating}
              onClick={() => {
                deactivateCustomer(item.id, {
                  onSuccess: () => setDeactivateDialogOpen(false),
                });
              }}
            >
              {isDeactivating ? "جارٍ التعطيل..." : "تعطيل"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeactivateDialogOpen(false)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
