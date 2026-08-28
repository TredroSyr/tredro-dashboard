"use client";

import { useEffect, useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { cn } from "@/lib/utils";

interface ProductImage {
  id: number;
  image: string;
  alt_text?: string;
}

interface ImageWithFallbackProps {
  images: ProductImage[] | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  iconSize?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
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
  images,
  alt,
  className,
  fallbackClassName,
  iconSize = 40,
  autoPlay = true,
  autoPlayInterval = 4000,
}: ImageWithFallbackProps) => {
  const validImages = (images ?? []).filter((img) => !!img?.image);
  const [active, setActive] = useState(0);
  const [hasError, setHasError] = useState(false);

  const hasMultiple = validImages.length > 1;

  useEffect(() => {
    if (!autoPlay || !hasMultiple) return;
    const id = setInterval(
      () => setActive((p) => (p + 1) % validImages.length),
      autoPlayInterval,
    );
    return () => clearInterval(id);
  }, [autoPlay, autoPlayInterval, hasMultiple, validImages.length]);

  const currentImage = validImages[active];
  const resolvedSrc = resolveImageSrc(currentImage?.image);

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
    <div className="relative w-full h-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={currentImage.id}
        src={resolvedSrc}
        alt={currentImage.alt_text || alt}
        className={cn("w-full h-full object-cover", className)}
        onError={() => setHasError(true)}
      />

      {hasMultiple && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {validImages.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setActive(i);
              }}
              aria-label={`صورة ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === active ? "w-5 bg-white" : "w-1.5 bg-white/50",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
