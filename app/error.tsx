"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/tredro/error-state";

/** Global Next.js error boundary — catches unexpected render/runtime crashes across the app. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <ErrorState error={error} onRetry={reset} />
    </div>
  );
}
