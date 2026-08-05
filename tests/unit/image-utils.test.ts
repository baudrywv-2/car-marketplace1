import { describe, expect, it } from "vitest";
import { getCarImageUrl } from "@/lib/image-utils";

describe("getCarImageUrl", () => {
  const original =
    "https://xyz.supabase.co/storage/v1/object/public/car-images/user/photo.jpg";

  it("returns null for empty src", () => {
    expect(getCarImageUrl(null)).toBeNull();
    expect(getCarImageUrl("")).toBeNull();
  });

  it("returns original when no size requested", () => {
    expect(getCarImageUrl(original)).toBe(original);
  });

  it("rewrites supabase object URLs to render transforms when enabled", () => {
    process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM = "1";
    const out = getCarImageUrl(original, { width: 480, quality: 72 });
    expect(out).toContain("/storage/v1/render/image/public/car-images/user/photo.jpg");
    expect(out).toContain("width=480");
    expect(out).toContain("quality=72");
  });

  it("leaves supabase URLs unchanged when transform is off", () => {
    process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM = "0";
    expect(getCarImageUrl(original, { width: 480 })).toBe(original);
  });

  it("leaves non-supabase URLs unchanged", () => {
    process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM = "1";
    const external = "https://images.unsplash.com/photo.jpg";
    expect(getCarImageUrl(external, { width: 400 })).toBe(external);
  });
});
