"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getCarImageUrl } from "@/lib/image-utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  /**
   * Request a resized source for grids/cards (Supabase Image Transform when available).
   * Typical: 400–480 card, 160 thumb strip, 1200 gallery hero.
   */
  thumbWidth?: number;
  quality?: number;
};

/** Uses Next/Image for Supabase URLs (optimized), falls back to img otherwise */
export default function OptimizedCarImage({
  src,
  alt,
  className = "",
  fill = true,
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
  thumbWidth,
  quality = 75,
}: Props) {
  const optimized = getCarImageUrl(src, thumbWidth ? { width: thumbWidth, quality } : undefined) ?? src;
  const [useOriginal, setUseOriginal] = useState(false);

  useEffect(() => {
    setUseOriginal(false);
  }, [src, thumbWidth, quality]);

  const currentSrc = useOriginal ? src : optimized;
  const isSupabase = currentSrc.startsWith("http") && currentSrc.includes("supabase.co");

  if (isSupabase) {
    return (
      <Image
        key={currentSrc}
        src={currentSrc}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={() => {
          // Transform may 404 without Supabase Pro — fall back to original object URL
          if (!useOriginal && currentSrc !== src) setUseOriginal(true);
        }}
      />
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`h-full w-full object-cover ${className}`}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (!useOriginal && currentSrc !== src) setUseOriginal(true);
      }}
    />
  );
}
