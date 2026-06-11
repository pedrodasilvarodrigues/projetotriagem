import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  await supabase.auth.signOut({ scope: "local" });
  return NextResponse.redirect(new URL("/login?message=saiu", request.url));
}
