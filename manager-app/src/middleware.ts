// Refreshes the Supabase auth session on every request and guards app routes.
// In dev-fallback mode (no Supabase env) it does nothing — auth is bypassed.
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  supabaseConfigured,
  AUTO_LOGIN,
  AUTO_LOGIN_EMAIL,
  AUTO_LOGIN_PASSWORD,
} from "@/lib/env";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(request: NextRequest) {
  if (!supabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  let {
    data: { user },
  } = await supabase.auth.getUser();

  // DEV convenience: silently sign in as the demo manager so the login screen is
  // skipped. Establishes a real session (cookies set on `response`), so RLS +
  // actions keep working. Runs only on the first request without a session.
  if (!user && AUTO_LOGIN && AUTO_LOGIN_EMAIL && AUTO_LOGIN_PASSWORD) {
    const { error } = await supabase.auth.signInWithPassword({
      email: AUTO_LOGIN_EMAIL,
      password: AUTO_LOGIN_PASSWORD,
    });
    if (!error) {
      user = (await supabase.auth.getUser()).data.user;
    }
  }

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/login");

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/overview";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on app routes, skip static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
