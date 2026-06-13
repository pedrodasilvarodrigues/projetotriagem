import { NextResponse, type NextRequest } from "next/server";
import { resolveAuthenticatedEntryPath } from "@/lib/auth/entry";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const signupRoleParam = requestUrl.searchParams.get("signupRole");
  const signupRole = signupRoleParam === "professional" || signupRoleParam === "company" ? signupRoleParam : null;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  let supabase: Awaited<ReturnType<typeof createServerClient>>;

  try {
    supabase = await createServerClient();
  } catch {
    console.error("[auth] Callback sem configuracao publica do Supabase");
    return NextResponse.redirect(new URL("/login?error=configuracao-supabase-incompleta", request.url));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth] Falha ao trocar code por sessao", { error: error.message });
      return NextResponse.redirect(new URL("/login?error=link-invalido", request.url));
    }
  }

  const { data, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error("[auth] Falha ao recuperar usuario no callback", { error: userError.message });
  }

  if (!data.user) {
    return NextResponse.redirect(new URL("/login?error=sessao-expirada", request.url));
  }

  console.log("[auth] Usuario autenticado no callback", { userId: data.user.id });

  if (safeNext?.startsWith("/update-password")) {
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  const entryPath = await resolveAuthenticatedEntryPath(supabase, data.user.id, data.user.user_metadata, signupRole).catch(() => null);
  if (!entryPath) {
    console.error("[auth] Usuario sem perfil/role resolvivel no callback", { userId: data.user.id });
    if (!signupRole) {
      await supabase.auth.signOut({ scope: "local" });
      return NextResponse.redirect(new URL("/login?error=conta-nao-cadastrada", request.url));
    }
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (!signupRole && entryPath.startsWith("/onboarding")) {
    console.warn("[auth] Login Google sem cadastro completo, retornando para login", { userId: data.user.id });
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.redirect(new URL("/login?error=conta-nao-cadastrada", request.url));
  }

  console.log("[auth] Redirecionando callback", { userId: data.user.id, route: entryPath });
  return NextResponse.redirect(new URL(entryPath, request.url));
}
