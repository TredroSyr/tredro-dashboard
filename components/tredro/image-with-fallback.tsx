"use client";

import { useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  iconSize?: number;
}

const ASSET_BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(
  /\/api\/?$/,
  "",
);

function resolveImageSrc(src: string | null | undefined): string | null {
  if (!src) return null;

  if (
    /^(https?:)?\/\//.test(src) ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  ) {
    return src;
  }

  const cleanPath = src.startsWith("/") ? src : `/${src}`;
  return `${ASSET_BASE_URL}${cleanPath}`;
}

export const ImageWithFallback = ({
  src,
  alt,
  className,
  fallbackClassName,
  iconSize = 40,
}: ImageWithFallbackProps) => {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = resolveImageSrc(src);

  if (!resolvedSrc || hasError) {
    return (
      <div
        className={cn(
          "w-full h-full bg-gradient-to-l from-primary/30 to-primary/10 flex items-center justify-center",
          fallbackClassName,
        )}
      >
        <IconRenderer
          name="no_image_filled"
          className="text-primary/50"
          width={iconSize}
          height={iconSize}
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={alt}
      className={cn("w-full h-full object-cover", className)}
      onError={() => setHasError(true)}
    />
  );
};
