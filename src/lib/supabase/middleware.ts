import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = ["/", "/archive", "/search", "/login", "/register", "/forgot-password", "/auth/callback"];

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) return true;
  if (pathname.startsWith("/archive/")) return true;
  if (pathname.startsWith("/auth/")) return true;
  if (pathname.startsWith("/api/")) return true;
  // All single-segment paths are potentially CMS pages (public)
  if (!pathname.startsWith("/dashboard") && pathname.split("/").length <= 2) return true;
  return false;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    // Redirect logged-in users away from auth pages
    if (user && (pathname === "/login" || pathname === "/register")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Protected routes require auth
  if (!user && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Editor routes require editor role
  if (pathname.startsWith("/dashboard/editor")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles")
      .eq("id", user!.id)
      .single();

    if (!profile?.roles?.includes("editor")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
