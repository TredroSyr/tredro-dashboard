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

export const ImageWithFallback = ({
  src,
  alt,
  className,
  fallbackClassName,
  iconSize = 40,
}: ImageWithFallbackProps) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "w-full h-full bg-gradient-to-l from-primary/30 to-primary/10 flex items-center justify-center",
          fallbackClassName
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
      src={src}
      alt={alt}
      className={cn("w-full h-full object-cover", className)}
      onError={() => setHasError(true)}
    />
  );
};
