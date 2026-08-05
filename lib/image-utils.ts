/**
 * Image URL utilities for car photos.
 * Prefer resized sources in grids so browse does not pull full-size uploads.
 * Set NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM=1 when Supabase Pro Image Transform is enabled.
 * Falls back to original URL when transform is off or unavailable (see OptimizedCarImage onError).
 * @see docs/SCALING.md
 */

export const CARD_IMAGE_WIDTH = 480;
export const GALLERY_THUMB_WIDTH = 160;
export const GALLERY_HERO_WIDTH = 1200;

const SUPABASE_STORAGE_PATTERN = /supabase\.co\/storage\/v1\/object\/public\//;

function transformEnabled() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM === "1" ||
    process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM === "true"
  );
}

/**
 * Build a thumbnail URL for grid/list views.
 * When Supabase Image Transform is enabled, uses the render endpoint.
 */
export function getCarImageUrl(
  src: string | null | undefined,
  options?: { width?: number; height?: number; quality?: number }
): string | null {
  if (!src || typeof src !== "string") return null;

  if (!options?.width && !options?.height) return src;
  if (!transformEnabled()) return src;

  // Already a transform URL — refresh params
  if (src.includes("/storage/v1/render/image/public/")) {
    try {
      const url = new URL(src);
      if (options.width) url.searchParams.set("width", String(options.width));
      if (options.height) url.searchParams.set("height", String(options.height));
      if (options.quality) url.searchParams.set("quality", String(options.quality));
      return url.toString();
    } catch {
      return src;
    }
  }

  // Supabase Storage Image Transform (Pro plan): use render endpoint
  if (SUPABASE_STORAGE_PATTERN.test(src)) {
    try {
      const url = new URL(src);
      const path = url.pathname.replace("/object/public/", "/render/image/public/");
      const transformUrl = `${url.origin}${path}`;
      const params = new URLSearchParams();
      if (options.width) params.set("width", String(options.width));
      if (options.height) params.set("height", String(options.height));
      if (options.quality) params.set("quality", String(options.quality ?? 75));
      const qs = params.toString();
      return qs ? `${transformUrl}?${qs}` : transformUrl;
    } catch {
      return src;
    }
  }

  return src;
}
