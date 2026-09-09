"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
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
import { Rep } from "../types";
import { useDeleteRepMutation } from "../hooks";
import { RepFormDrawer } from "./actions-drawer";
import { PermissionGate } from "@/components/tredro/PermissionGate";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const item = row.original as Rep;
  const router = useRouter();

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = React.useState(false);

  const { mutate: deleteRep, isPending: isDeleting } = useDeleteRepMutation();

  return (
    <>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/reps/detail?id=${item.id}`)}
        >
          <IconRenderer
            name="eye_visible_outlined"
            className="size-4 text-muted-foreground"
          />
        </Button>
        <PermissionGate module="reps" requireAction fallback={null}>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon">
                <IconRenderer name="menu_outlined" className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditDrawerOpen(true)}>
                <IconRenderer name="edit_outlined" className="size-4" />
                تعديل
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <IconRenderer
                  name="bin_outlined"
                  className="size-4 text-destructive"
                />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionGate>
      </div>

      <RepFormDrawer
        mode="edit"
        repId={item.id}
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">حذف المندوب</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-right">
            هل أنت متأكد من حذف{" "}
            <span className="font-medium text-foreground">{item.name}</span>؟ لا
            يمكن التراجع عن هذا الإجراء.
          </p>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                deleteRep(item.id, {
                  onSuccess: () => setDeleteDialogOpen(false),
                });
              }}
            >
              {isDeleting ? "جارٍ الحذف..." : "حذف"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
