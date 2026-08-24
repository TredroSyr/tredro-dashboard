"use client";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorDisplay({
  title = "حدث خطأ أثناء تحميل البيانات",
  message = "يرجى التحقق من الاتصال بالإنترنت وإعادة المحاولة",
  onRetry,
  compact = false,
}: ErrorDisplayProps) {
  if (compact) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 py-10">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="flex flex-col gap-2 text-center">
        <p className="text-base font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
