"use client";

import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
};

/** Uses Next/Image for Supabase URLs (optimized), falls back to img otherwise */
export default function OptimizedCarImage({
  src,
  alt,
  className = "",
  fill = true,
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
}: Props) {
  const isSupabase = src.startsWith("http") && src.includes("supabase.co");

  if (isSupabase) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`h-full w-full object-cover ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}
