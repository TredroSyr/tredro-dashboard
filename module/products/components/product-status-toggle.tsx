"use client";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Product } from "../types";
import { useDeleteProductMutation, useUpdateProductMutation } from "../hook";

interface ProductStatusToggleProps {
  product: Product;
  children: (handlers: { onToggle: () => void; isPending: boolean }) => React.ReactNode;
}

/**
 * Shared confirm-dialog + mutation logic for flipping a product's is_active
 * state. Rendered via a render-prop so the same dialogs can be triggered
 * from different UI (table row icons, card badge, ...).
 */
export function ProductStatusToggle({
  product,
  children,
}: ProductStatusToggleProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = React.useState(false);

  const { mutate: deleteProduct, isPending: isDeleting } =
    useDeleteProductMutation();
  const { mutate: updateProduct, isPending: isRestoring } =
    useUpdateProductMutation();

  const onToggle = () => {
    if (product.is_active) setDeleteDialogOpen(true);
    else setRestoreDialogOpen(true);
  };

  return (
    <>
      {children({
        onToggle,
        isPending: product.is_active ? isDeleting : isRestoring,
      })}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">حذف المنتج</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-right">
            هل أنت متأكد من حذف{" "}
            <span className="font-medium text-foreground">
              {product.name}
            </span>
            ؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() =>
                deleteProduct(product.id, {
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

      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">استعادة المنتج</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-right">
            هل تريد استعادة{" "}
            <span className="font-medium text-foreground">
              {product.name}
            </span>{" "}
            وإعادة تفعيله؟
          </p>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              disabled={isRestoring}
              onClick={() =>
                updateProduct(
                  { id: product.id, is_active: true },
                  { onSuccess: () => setRestoreDialogOpen(false) },
                )
              }
            >
              {isRestoring ? "جارٍ الاستعادة..." : "استعادة"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setRestoreDialogOpen(false)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
