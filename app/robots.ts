import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  // Prefer hostname without scheme for Host directive when possible
  let host = SITE_URL;
  try {
    host = new URL(SITE_URL).host;
  } catch {
    host = "www.drccars.com";
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/login", "/signup"],
    },
    host,
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
