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
  const supabase = await createServerClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.redirect(new URL("/login?error=sessao-expirada", request.url));
  }

  if (safeNext?.startsWith("/update-password")) {
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  const entryPath = await resolveAuthenticatedEntryPath(supabase, data.user.id, data.user.user_metadata, signupRole);
  return NextResponse.redirect(new URL(entryPath, request.url));
}
