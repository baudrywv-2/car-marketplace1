/**
 * Image URL utilities for car photos.
 * For scale (10k+ images): Supabase Storage Image Transform (Pro) or CDN recommended.
 * @see docs/SCALING.md
 */

const SUPABASE_STORAGE_PATTERN = /supabase\.co\/storage\/v1\/object\/public\//;

/**
 * Build a thumbnail URL for grid/list views.
 * When Supabase Image Transform (Pro) is enabled, append ?width=400 for smaller payloads.
 */
export function getCarImageUrl(
  src: string | null | undefined,
  options?: { width?: number; height?: number; quality?: number }
): string | null {
  if (!src || typeof src !== "string") return null;

  if (!options?.width && !options?.height) return src;

  // Supabase Storage Image Transform (Pro plan): use render endpoint
  if (SUPABASE_STORAGE_PATTERN.test(src)) {
    const url = new URL(src);
    const path = url.pathname.replace("/object/public/", "/render/image/public/");
    const transformUrl = `${url.origin}${path}`;
    const params = new URLSearchParams();
    if (options.width) params.set("width", String(options.width));
    if (options.height) params.set("height", String(options.height));
    if (options.quality) params.set("quality", String(options.quality));
    const qs = params.toString();
    return qs ? `${transformUrl}?${qs}` : transformUrl;
  }

  return src;
}
