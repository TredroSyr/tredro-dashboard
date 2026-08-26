"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, Eye } from "lucide-react";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Product } from "../types";

import { PermissionGate } from "@/components/tredro/PermissionGate";
import { useDeleteProductMutation } from "../hook";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const item = row.original as Product;
  const router = useRouter();

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const { mutate: deleteProduct, isPending: isDeleting } =
    useDeleteProductMutation();

  return (
    <>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/products/detail?id=${item.id}`)}
        >
          <Eye className="size-4 text-muted-foreground" />
        </Button>
        <PermissionGate module="products" requireAction fallback={null}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/products/${item.id}/edit`)}
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
        </PermissionGate>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">حذف المنتج</DialogTitle>
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
              onClick={() =>
                deleteProduct(item.id, {
                  onSuccess: () => setDeleteDialogOpen(false),
                })
              }
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
