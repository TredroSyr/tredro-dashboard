import {
  IllustrationHalo,
  StateActions,
  stateButtonStyles,
} from "@/components/tredro/state-shell";
import { stateImages } from "@/lib/illustrations";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface NotFoundStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export default function NotFoundPage({
  title = "عذرًا! الصفحة غير موجودة",
  description = "الرابط الذي فتحته غير صحيح أو تمت إزالة الصفحة. يمكنك العودة إلى الصفحة الرئيسية والمتابعة من هناك.",
  actionLabel = "العودة للرئيسية",
  actionHref = "/",
  className,
}: NotFoundStateProps) {
  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <div className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
        <IllustrationHalo
          src={stateImages.notFound}
          alt="روبوت معطّل يعبّر عن صفحة غير موجودة"
          className="order-first mx-auto w-64 sm:w-80 md:order-last md:w-full md:max-w-md"
        />

        <div className="text-center md:text-right">
          <p className="bg-gradient-to-l from-primary to-primary/50 bg-clip-text text-7xl font-black tracking-tight text-transparent sm:text-8xl">
            404
          </p>
          <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground md:mx-0">
            {description}
          </p>
          <div className="mt-7 flex justify-center md:justify-start">
            <StateActions>
              <Link href={actionHref} className={stateButtonStyles.primary}>
                {actionLabel}
              </Link>
            </StateActions>
          </div>
        </div>
      </div>
    </div>
  );
}
