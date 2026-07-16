import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function defaultRouteForRole(role?: string | null) {
  if (role === "admin") return "/admin/administration";
  if (role === "company") return "/company/demands";
  if (role === "client") return "/client";
  return "/professional/profile";
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/confirm-email", "/update-password", "/acesso-negado"];

  if (path === "/profissional" || path.startsWith("/profissional/")) {
    return NextResponse.redirect(new URL(path.replace("/profissional", "/professional"), request.url));
  }

  if (path === "/empresa" || path.startsWith("/empresa/")) {
    return NextResponse.redirect(new URL(path.replace("/empresa", "/company"), request.url));
  }

  if (path === "/" && request.nextUrl.searchParams.has("code")) {
    const callbackUrl = new URL("/auth/callback", request.url);
    request.nextUrl.searchParams.forEach((value, key) => callbackUrl.searchParams.set(key, value));
    return NextResponse.redirect(callbackUrl);
  }

  if (publicRoutes.includes(path) || path.startsWith("/auth/callback") || path.startsWith("/auth/confirm") || path.startsWith("/auth/sign-out")) {
    return NextResponse.next({ request });
  }

  if (process.env.DEMO_MODE === "true") {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const protectedArea = path.startsWith("/admin") || path.startsWith("/company") || path.startsWith("/professional") || path.startsWith("/client") || path.startsWith("/marketplace") || path.startsWith("/onboarding");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[auth] Proxy sem variaveis publicas do Supabase", { path });
    if (protectedArea) return NextResponse.redirect(new URL("/login?error=configuracao-supabase-incompleta", request.url));
    return response;
  }

  try {
    new URL(supabaseUrl);
  } catch {
    console.error("[auth] Proxy com URL do Supabase invalida", { path });
    if (protectedArea) return NextResponse.redirect(new URL("/login?error=configuracao-supabase-incompleta", request.url));
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const { data, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error("[auth] Proxy falhou ao recuperar usuario", { path, error: userError.message });
  }

  if (protectedArea && !data.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (data.user && path.startsWith("/onboarding")) {
    return response;
  }

  if (data.user && protectedArea) {
    const { data: roleRecord, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle();
    if (roleError) {
      console.error("[auth] Proxy falhou ao buscar role", { path, userId: data.user.id, error: roleError.message });
    }

    const role = roleRecord?.role;

    if (!role && !path.startsWith("/onboarding")) {
      console.log("[auth] Proxy redirecionando usuario sem role para onboarding", { path, userId: data.user.id });
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // Do not force already authenticated users back into onboarding.
    // Missing profile details can be completed from inside the protected area.

    if (path.endsWith("/dashboard")) {
      return NextResponse.redirect(new URL(defaultRouteForRole(role), request.url));
    }

    if (path.startsWith("/admin") && role !== "admin") return NextResponse.redirect(new URL("/acesso-negado", request.url));
    if (path.startsWith("/company") && role !== "company") return NextResponse.redirect(new URL("/acesso-negado", request.url));
    if (path.startsWith("/professional") && role !== "professional") return NextResponse.redirect(new URL("/acesso-negado", request.url));
    if (path.startsWith("/client") && role !== "client") return NextResponse.redirect(new URL("/acesso-negado", request.url));
    if (path.startsWith("/marketplace") && role !== "client" && role !== "professional" && role !== "admin") return NextResponse.redirect(new URL("/acesso-negado", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
