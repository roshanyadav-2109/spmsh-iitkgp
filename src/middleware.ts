import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Twelve hours, per the brief. Enforced here because session time-boxing is
 *  a paid Supabase feature and this project is on the free plan. */
const MAX_SESSION_HOURS = 12;

/**
 * Refreshes the Supabase session on every portal request and turns away anyone
 * who is not signed in.
 *
 * Role checks are deliberately not done here. Middleware runs before the
 * request reaches the route, and a role read here would have to be trusted
 * downstream. Instead each portal layout re-reads the role from the database
 * on every request, so a role that is revoked mid-session takes effect on the
 * user's very next page load.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser revalidates against the auth server. getSession would only read
  // the cookie, which the browser controls.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPortal = pathname.startsWith("/portal");

  if (user && user.last_sign_in_at) {
    const signedInFor = Date.now() - new Date(user.last_sign_in_at).getTime();
    if (signedInFor > MAX_SESSION_HOURS * 3_600_000) {
      await supabase.auth.signOut();
      if (isPortal) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.search = "?reason=expired";
        return NextResponse.redirect(url);
      }
    }
  }

  if (isPortal && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/portal/:path*", "/login"],
};
