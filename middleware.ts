import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isApexDrccarsHost, preferredDrccarsOrigin } from "@/lib/site-url";

/**
 * 1) Force preferred host (www) with 308 — fixes GSC apex/www duplicate noise.
 * 2) Refresh Supabase session only on auth-related routes.
 */
export async function middleware(request: NextRequest) {
  const host = request.headers.get("host");

  if (isApexDrccarsHost(host)) {
    const dest = new URL(request.nextUrl.pathname + request.nextUrl.search, preferredDrccarsOrigin());
    return NextResponse.redirect(dest, 308);
  }

  const path = request.nextUrl.pathname;
  const needsAuthRefresh =
    path.startsWith("/dashboard") ||
    path === "/login" ||
    path === "/signup" ||
    path.startsWith("/signup/") ||
    path === "/favorites" ||
    path === "/compare" ||
    path.startsWith("/api/favorites") ||
    path.startsWith("/api/admin") ||
    path.startsWith("/api/analytics");

  if (!needsAuthRefresh) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Host redirect + auth cookie refresh.
     * Skip static assets / image optimizer.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
