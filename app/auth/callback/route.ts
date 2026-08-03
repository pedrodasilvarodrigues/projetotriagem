import { NextResponse, type NextRequest } from "next/server";
import { resolveAuthenticatedEntryPath } from "@/lib/auth/entry";
import { createServerClient } from "@/lib/supabase/server";
import { safeInternalRedirect } from "@/lib/auth/safe-redirect";

const oauthNextCookie = "portal_oauth_next";
const oauthRoleCookie = "portal_oauth_role";

function redirectAfterOauth(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.delete(oauthNextCookie);
  response.cookies.delete(oauthRoleCookie);
  return response;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");
  const next = requestUrl.searchParams.get("next") ?? request.cookies.get(oauthNextCookie)?.value ?? null;
  const signupRoleParam = requestUrl.searchParams.get("signupRole") ?? request.cookies.get(oauthRoleCookie)?.value ?? null;
  const signupRole = signupRoleParam === "professional" || signupRoleParam === "company" ? signupRoleParam : null;
  const safeNext = safeInternalRedirect(next, "") || null;

  if (oauthError) {
    const errorCode = oauthError === "access_denied" ? "google-cancelado" : "nao-foi-possivel-iniciar-google";
    return redirectAfterOauth(request, `/login?error=${errorCode}`);
  }
  let supabase: Awaited<ReturnType<typeof createServerClient>>;

  try {
    supabase = await createServerClient();
  } catch {
    console.error("[auth] Callback sem configuração pública do Supabase");
    return redirectAfterOauth(request, "/login?error=configuracao-supabase-incompleta");
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth] Falha ao trocar code por sessão", { error: error.message });
      return redirectAfterOauth(request, "/login?error=link-invalido");
    }
  }

  const { data, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error("[auth] Falha ao recuperar usuário no callback", { error: userError.message });
  }

  if (!data.user) {
    return redirectAfterOauth(request, "/login?error=sessao-expirada");
  }

  console.log("[auth] Usuário autenticado no callback", { userId: data.user.id });

  if (safeNext?.startsWith("/update-password")) {
    return redirectAfterOauth(request, safeNext);
  }

  const entryPath = await resolveAuthenticatedEntryPath(supabase, data.user.id, data.user.user_metadata, signupRole).catch(() => null);
  if (!entryPath) {
    console.error("[auth] Usuário sem perfil/role resolúvel no callback", { userId: data.user.id });
    return redirectAfterOauth(request, "/onboarding");
  }

  if (entryPath.startsWith("/onboarding")) {
    console.log("[auth] Cadastro incompleto, seguindo para onboarding", { userId: data.user.id, route: entryPath });
    return redirectAfterOauth(request, entryPath);
  }

  if (safeNext) {
    console.log("[auth] Redirecionando callback para destino preservado", { userId: data.user.id, route: safeNext });
    return redirectAfterOauth(request, safeNext);
  }

  console.log("[auth] Redirecionando callback", { userId: data.user.id, route: entryPath });
  return redirectAfterOauth(request, entryPath);
}
