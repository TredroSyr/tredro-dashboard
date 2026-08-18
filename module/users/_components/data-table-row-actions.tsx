"use client";
import * as React from "react";
import { Trash2, Pencil } from "lucide-react";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubUser } from "../types";
import { useDeleteSubUserMutation, useUpdateSubUserMutation } from "../hooks";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const item = row.original as SubUser;

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [nameInput, setNameInput] = React.useState(item.name);
  const [isActive, setIsActive] = React.useState(item.is_active);

  const { mutate: deleteSubUser, isPending: isDeleting } =
    useDeleteSubUserMutation();
  const { mutate: updateSubUser, isPending: isUpdating } =
    useUpdateSubUserMutation();

  // Owner can't be edited/removed from here
  if (item.is_owner) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setNameInput(item.name);
            setIsActive(item.is_active);
            setEditDialogOpen(true);
          }}
        >
          <Pencil className="size-4 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">تعديل المستخدم</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-right">الاسم</Label>
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="text-right"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>الحساب مفعّل</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              disabled={isUpdating || !nameInput.trim()}
              onClick={() => {
                updateSubUser(
                  { id: item.id, name: nameInput.trim(), is_active: isActive },
                  { onSuccess: () => setEditDialogOpen(false) },
                );
              }}
            >
              {isUpdating ? "جارٍ الحفظ..." : "حفظ"}
            </Button>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">حذف المستخدم</DialogTitle>
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
                deleteSubUser(item.id, {
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
