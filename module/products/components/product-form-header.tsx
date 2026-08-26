"use client";

import * as React from "react";
import { ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface BreadcrumbItemType {
  label: string;
  href?: string;
}

interface ProductFormHeaderProps {
  title: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  isEditMode: boolean;
  isSubmitting: boolean;
  isLoading?: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  breadcrumbItems?: BreadcrumbItemType[];
}

export const ProductFormHeader = ({
  title,
  description,
  imageUrl,
  isActive,
  isEditMode,
  isSubmitting,
  isLoading = false,
  onSaveDraft,
  onPublish,
  breadcrumbItems = [
    { label: "الرئيسية", href: "/" },
    { label: "المنتجات", href: "/products" },
  ],
}: ProductFormHeaderProps) => {
  return (
    <div className="flex  flex-col gap-4 border-b px-4 py-4 border-border sm:px-6 sm:py-6">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbItems.map((item) => (
            <React.Fragment key={item.label}>
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </React.Fragment>
          ))}
          <BreadcrumbItem>
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <BreadcrumbPage>{title}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Separator />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {isLoading ? (
            <Skeleton className="size-14 rounded-lg shrink-0" />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-5 text-muted-foreground" />
              )}
            </div>
          )}

          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              {isLoading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <h1 className="text-base font-semibold tracking-tight sm:text-lg truncate">
                  {title || "منتج بدون اسم"}
                </h1>
              )}
              {!isLoading && (
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? "منشور" : "مسودة"}
                </Badge>
              )}
            </div>
            {isLoading ? (
              <Skeleton className="h-4 w-48" />
            ) : (
              <p className="text-sm text-muted-foreground truncate max-w-md">
                {description || "لا يوجد وصف"}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={onSaveDraft}
            disabled={isSubmitting || isLoading}
            className="flex-1 sm:flex-none"
          >
            {isSubmitting ? "جارٍ الحفظ..." : "حفظ كمسودة"}
          </Button>
          <Button
            onClick={onPublish}
            disabled={isSubmitting || isLoading}
            className="flex-1 sm:flex-none"
          >
            {isSubmitting ? "جارٍ النشر..." : "نشر المنتج"}
          </Button>
        </div>
      </div>
    </div>
  );
};
