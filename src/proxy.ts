// Next.js 16 uses proxy.ts. On Next.js 15 or earlier, rename this file to middleware.ts.
import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const response = handleI18n(request);

  // Let next-intl's own redirects (e.g. "/" -> "/ar") pass untouched
  if (response.status >= 300 && response.status < 400) return response;

  // Never crash the whole site if Supabase env vars are missing
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return response;

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data } = await supabase.auth.getClaims();
    const isLoggedIn = Boolean(data?.claims);

    // Locales are hardcoded here: keep in sync with routing.ts
    const match = request.nextUrl.pathname.match(/^\/(ar|en)(\/.*)?$/);
    if (match) {
      const locale = match[1];
      const rest = match[2] ?? "/";
      const isProtected = rest === "/dashboard" || rest.startsWith("/dashboard/");
      const isAuthPage = rest === "/login" || rest === "/signup";

      if ((isProtected && !isLoggedIn) || (isAuthPage && isLoggedIn)) {
        const url = request.nextUrl.clone();
        url.pathname = isProtected ? `/${locale}/login` : `/${locale}/dashboard`;
        url.search = "";
        const redirect = NextResponse.redirect(url);
        response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
        return redirect;
      }
    }
  } catch {
    // If the auth check fails, serve the page instead of a 500
  }

  return response;
}

export const config = {
  matcher: "/((?!api|auth|trpc|_next|_vercel|.*\\..*).*)",
};
