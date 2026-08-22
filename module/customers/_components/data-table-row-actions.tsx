"use client";
import * as React from "react";
import { MoreVertical, Pencil, Ban, RotateCcw } from "lucide-react";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Customer } from "../types";
import {
  useDeactivateCustomerMutation,
  useUpdateCustomerMutation,
} from "../hooks";
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
  const { mutate: updateCustomer, isPending: isReactivating } =
    useUpdateCustomerMutation();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditDrawerOpen(true)}>
            <Pencil className="size-4" />
            تعديل
          </DropdownMenuItem>
          {item.is_active ? (
            <DropdownMenuItem
              onClick={() => setDeactivateDialogOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Ban className="size-4" />
              تعطيل
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={isReactivating}
              onClick={() => updateCustomer({ id: item.id, is_active: true })}
            >
              <RotateCcw className="size-4" />
              إعادة تفعيل
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
          <p className="text-sm font-normal text-muted-foreground text-right">
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
