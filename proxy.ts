import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function defaultRouteForRole(role?: string | null) {
  if (role === "admin") return "/admin/administration";
  if (role === "company") return "/company/demands";
  return "/professional/profile";
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/confirm-email", "/update-password", "/acesso-negado"];

  if (path === "/" && request.nextUrl.searchParams.has("code")) {
    const callbackUrl = new URL("/auth/callback", request.url);
    request.nextUrl.searchParams.forEach((value, key) => callbackUrl.searchParams.set(key, value));
    return NextResponse.redirect(callbackUrl);
  }

  if (publicRoutes.includes(path) || path.startsWith("/auth/callback") || path.startsWith("/auth/confirm")) {
    return NextResponse.next({ request });
  }

  if (process.env.DEMO_MODE === "true") {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
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

  const { data } = await supabase.auth.getUser();
  const protectedArea = path.startsWith("/admin") || path.startsWith("/company") || path.startsWith("/professional") || path.startsWith("/onboarding");

  if (protectedArea && !data.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (data.user && path.startsWith("/onboarding")) {
    return response;
  }

  if (data.user && protectedArea) {
    const { data: roleRecord } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).single();
    const role = roleRecord?.role;

    if (path.startsWith("/professional") && role === "professional") {
      const { data: professional } = await supabase
        .from("professionals")
        .select("id,cpf,phone,cep,street,address_number,neighborhood,city,state")
        .eq("user_id", data.user.id)
        .maybeSingle();
      const { data: resume } = professional?.id
        ? await supabase.from("resumes").select("id").eq("professional_id", professional.id).maybeSingle()
        : { data: null };
      const { data: consent } = await supabase.from("consent_records").select("id").eq("user_id", data.user.id).limit(1).maybeSingle();
      const complete = Boolean(
        professional?.cpf &&
        professional.phone &&
        professional.cep &&
        professional.street &&
        professional.address_number &&
        professional.neighborhood &&
        professional.city &&
        professional.state &&
        resume?.id &&
        consent?.id
      );
      if (!complete) return NextResponse.redirect(new URL(professional?.id ? "/onboarding/professional/resume" : "/onboarding/professional", request.url));
    }

    if (path.startsWith("/company") && role === "company") {
      const { data: company } = await supabase
        .from("companies")
        .select("id,cnpj,phone,corporate_email,cep,street,address_number,neighborhood,city,state")
        .eq("owner_id", data.user.id)
        .maybeSingle();
      const { data: contact } = company?.id
        ? await supabase.from("company_contacts").select("id").eq("company_id", company.id).limit(1).maybeSingle()
        : { data: null };
      const { data: consent } = await supabase.from("consent_records").select("id").eq("user_id", data.user.id).limit(1).maybeSingle();
      const complete = Boolean(
        company?.cnpj &&
        company.phone &&
        company.corporate_email &&
        company.cep &&
        company.street &&
        company.address_number &&
        company.neighborhood &&
        company.city &&
        company.state &&
        contact?.id &&
        consent?.id
      );
      if (!complete) return NextResponse.redirect(new URL("/onboarding/company", request.url));
    }

    if (path.endsWith("/dashboard")) {
      return NextResponse.redirect(new URL(defaultRouteForRole(role), request.url));
    }

    if (path.startsWith("/admin") && role !== "admin") return NextResponse.redirect(new URL("/acesso-negado", request.url));
    if (path.startsWith("/company") && role !== "company") return NextResponse.redirect(new URL("/acesso-negado", request.url));
    if (path.startsWith("/professional") && role !== "professional") return NextResponse.redirect(new URL("/acesso-negado", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
