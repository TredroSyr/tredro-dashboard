"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { PhoneInput } from "@/components/tredro/phone-input";
import { Skeleton } from "@/components/ui/skeleton";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { CustomerRequestStatus } from "../types";
import { RequestStatusBadge } from "./status-badge";

interface OrderDetailHeaderProps {
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  status?: CustomerRequestStatus;
  lineCount?: number;
  isLoading?: boolean;
}

export function OrderDetailHeader({
  customerId,
  customerName,
  customerPhone,
  status,
  lineCount,
  isLoading = false,
}: OrderDetailHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 border-b px-4 py-4 border-border sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {isLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
                {customerName ?? "تفاصيل الطلب"}
              </h1>
            )}
            {isLoading ? (
              <Skeleton className="h-6 w-16 rounded-full" />
            ) : (
              status && <RequestStatusBadge status={status} />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-10 w-48" />
            ) : (
              <PhoneInput value={customerPhone ?? ""} readOnly className="w-full sm:w-auto" />
            )}
            {!isLoading && lineCount !== undefined && (
              <span className="text-sm text-muted-foreground">{lineCount} صنف</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {customerId && (
            <Link
              href={`/customers/detail?id=${customerId}`}
              title="عرض ملف العميل"
              className={buttonVariants({ variant: "outline", size: "icon" })}
            >
              <IconRenderer name="eye_visible_outlined" className="size-4" />
            </Link>
          )}

          <Button
            variant="outline"
            size="icon"
            className="gap-1.5 sm:w-auto sm:px-3"
            onClick={() => router.back()}
          >
            <ArrowRight className="h-4 w-4" />
            <span className="hidden sm:inline">رجوع</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
