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
    return NextResponse.redirect(new URL("/login?error=configuracao-supabase-incompleta", request.url));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/login?error=link-invalido", request.url));
    }
  }

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.redirect(new URL("/login?error=sessao-expirada", request.url));
  }

  if (safeNext?.startsWith("/update-password")) {
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  const entryPath = await resolveAuthenticatedEntryPath(supabase, data.user.id, data.user.user_metadata, signupRole).catch(() => null);
  if (!entryPath) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => null);
    return NextResponse.redirect(new URL("/login?error=conta-nao-cadastrada", request.url));
  }

  return NextResponse.redirect(new URL(entryPath, request.url));
}
