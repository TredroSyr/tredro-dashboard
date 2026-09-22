"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IconRenderer } from "@/assets/icons/iconRenderer";

interface CompanyProfileCardProps {
  companyName: string;
  companyLogo?: string | null;
  accountName?: string | null;
  isAccountLoading: boolean;
  onboardingCompleted?: boolean;
  onClick: () => void;
  /** Whether the signed-in account can open /profile (the `profile` module).
   * Without it the card still shows — just inert, not a dead link that 403s. */
  clickable?: boolean;
}

export function CompanyProfileCard({
  companyName,
  companyLogo,
  accountName,
  isAccountLoading,
  onboardingCompleted,
  onClick,
  clickable = true,
}: CompanyProfileCardProps) {
  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={cn(
        "mt-4 flex items-center gap-3 rounded-xl border border-border bg-primary/5 p-3 transition-all duration-200",
        clickable
          ? "cursor-pointer hover:bg-primary/10 active:scale-[0.97]"
          : "cursor-default",
      )}
    >
      <Avatar className="h-10 w-10 shrink-0 border-2 border-background">
        <AvatarImage
          src={companyLogo || undefined}
          alt={companyName}
          className="h-full w-full object-cover"
        />
        <AvatarFallback className="bg-primary/20 text-primary flex items-center justify-center">
          <IconRenderer
            name="no_image_filled"
            className="h-5 w-5 text-primary/50"
          />
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 group-data-[collapsible=icon]:hidden">
        <p className="truncate text-sm font-semibold text-foreground">
          {companyName}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {isAccountLoading && !accountName ? (
            <Skeleton className="h-4 w-16 rounded-full" />
          ) : (
            accountName && (
              <Badge
                variant="secondary"
                className="h-4 gap-1 bg-primary/10 px-1.5 text-[10px] text-primary dark:bg-primary/20"
              >
                {accountName}
              </Badge>
            )
          )}
          {!onboardingCompleted && (
            <Badge
              variant="secondary"
              className="h-4 bg-amber-100 px-1.5 text-[10px] text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
            >
              غير مكتمل
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
