"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/tredro/error-state";

/** Next.js error boundary for the protected section — catches unexpected render/runtime crashes. */
export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState error={error} onRetry={reset} />;
}
