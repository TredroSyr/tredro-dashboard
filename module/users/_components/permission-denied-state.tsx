import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  IllustrationHalo,
  StateActions,
  stateButtonStyles,
} from "@/components/tredro/state-shell";
import { stateImages } from "@/lib/illustrations";

export interface PermissionDeniedStateProps {
  title?: string;
  description?: string;
  homeHref?: string;
  contactHref?: string;
  className?: string;
}

export function PermissionDeniedState({
  title = "لا تملك صلاحية الوصول إلى هذه الصفحة",
  description = "هذه الصفحة محمية بصلاحيات خاصة. إذا كنت تعتقد أنه يجب أن تصل إليها، تواصل مع مدير النظام لمنحك الصلاحية المناسبة.",
  homeHref = "/home",
  contactHref,
  className,
}: PermissionDeniedStateProps) {
  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <div className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
        <IllustrationHalo
          src={stateImages.permissionDenied}
          alt="قفل ودرع يعبّران عن منع الوصول"
          className="order-first mx-auto w-60 sm:w-72 md:order-last md:w-full md:max-w-sm"
        />

        <div className="text-center md:text-right">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            صلاحيات غير كافية
          </span>
          <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground md:mx-0">
            {description}
          </p>
          <div className="mt-7 flex justify-center md:justify-start">
            <StateActions>
              <Link href={homeHref} className={stateButtonStyles.primary}>
                العودة للرئيسية
              </Link>
              {contactHref ? (
                <a href={contactHref} className={stateButtonStyles.ghost}>
                  تواصل مع المدير
                </a>
              ) : null}
            </StateActions>
          </div>
        </div>
      </div>
    </div>
  );
}
