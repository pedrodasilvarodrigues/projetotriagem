import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

const allowedTypes = new Set(["signup", "invite", "magiclink", "recovery", "email_change", "email"]);

function safePath(value: string | null) {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;

  try {
    const url = new URL(value);
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") ?? "recovery";
  const next = safePath(requestUrl.searchParams.get("next")) ?? "/auth/callback";

  if (!tokenHash || !allowedTypes.has(type)) {
    return NextResponse.redirect(new URL("/login?error=link-invalido", request.url));
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType
  });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=link-invalido", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
