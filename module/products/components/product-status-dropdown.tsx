"use client";
import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { Product } from "../types";
import { useUpdateProductMutation } from "../hook";

interface ProductStatusDropdownProps {
  product: Product;
}

const STATUS_LABEL: Record<Product["status"], string> = {
  published: "منشور",
  draft: "مسودة",
};

/**
 * status (draft/published) is a separate concept from is_active
 * (enabled/disabled) — this only ever PATCHes `status`, never touches
 * is_active and never calls the delete endpoint.
 */
export function ProductStatusDropdown({ product }: ProductStatusDropdownProps) {
  const [pendingStatus, setPendingStatus] = React.useState<
    Product["status"] | null
  >(null);

  const { mutate: updateProduct, isPending } = useUpdateProductMutation();

  const confirmChange = () => {
    if (!pendingStatus) return;
    updateProduct(
      { id: product.id, status: pendingStatus },
      { onSuccess: () => setPendingStatus(null) },
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Badge
            variant={product.status === "published" ? "success" : "warning"}
            className="cursor-pointer gap-1"
          >
            {STATUS_LABEL[product.status]}
            <ChevronDown className="size-3" />
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {product.status === "draft" ? (
            <DropdownMenuItem onClick={() => setPendingStatus("published")}>
              نشر
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setPendingStatus("draft")}>
              حفظ كمسودة
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={pendingStatus !== null}
        onOpenChange={(open) => !open && setPendingStatus(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">تغيير حالة المنتج</DialogTitle>
          </DialogHeader>
          <p className="flex flex-wrap items-center justify-end gap-1 text-sm text-muted-foreground text-right">
            هل تريد تغيير حالة{" "}
            <span className="font-medium text-foreground">{product.name}</span>{" "}
            من{" "}
            <Badge
              variant={product.status === "published" ? "success" : "warning"}
            >
              {STATUS_LABEL[product.status]}
            </Badge>{" "}
            إلى{" "}
            {pendingStatus && (
              <Badge
                variant={pendingStatus === "published" ? "success" : "warning"}
              >
                {STATUS_LABEL[pendingStatus]}
              </Badge>
            )}
            ؟
          </p>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              variant={pendingStatus === "published" ? "success" : "warning"}
              disabled={isPending}
              onClick={confirmChange}
            >
              {isPending ? "جارٍ الحفظ..." : "تأكيد"}
            </Button>
            <Button variant="outline" onClick={() => setPendingStatus(null)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
