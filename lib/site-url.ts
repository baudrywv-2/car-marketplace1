/**
 * Canonical public origin for DRCCARS.
 * Preferred host is www (apex already redirects there on Vercel).
 * Keep NEXT_PUBLIC_SITE_URL in sync in production.
 */

const PREFERRED_HOST = "www.drccars.com";
const APEX_HOST = "drccars.com";

function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

/** Normalize any env / request URL to the preferred https://www host. */
export function normalizeSiteUrl(raw?: string | null): string {
  const fallback = `https://${PREFERRED_HOST}`;
  if (!raw?.trim()) return fallback;

  try {
    const u = new URL(raw.trim().includes("://") ? raw.trim() : `https://${raw.trim()}`);
    const host = u.hostname.toLowerCase();
    // Apex or www → single preferred origin (sitemap / canonical / OG)
    if (host === APEX_HOST || host === PREFERRED_HOST) {
      return fallback;
    }
    // Preview / localhost / other: keep as-is
    return stripTrailingSlash(`${u.protocol}//${u.host}`);
  } catch {
    return fallback;
  }
}

export function isApexDrccarsHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  return h === APEX_HOST;
}

export function preferredDrccarsOrigin(): string {
  return `https://${PREFERRED_HOST}`;
}

export { PREFERRED_HOST, APEX_HOST };
