import { NextResponse } from "next/server";
import { cleanInstitutionName, normalizeInstitutionName } from "@/lib/institutions";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createServerClient();
  const { searchParams } = new URL(request.url);
  const query = cleanInstitutionName(searchParams.get("q") ?? "");
  const normalized = normalizeInstitutionName(query);

  if (query.length < 2) return NextResponse.json({ institutions: [] });

  const { data } = await supabase
    .from("institutions")
    .select("id,name,status")
    .or(`name.ilike.%${query}%,normalized_name.ilike.%${normalized}%`)
    .order("status", { ascending: true })
    .order("name", { ascending: true })
    .limit(8);

  return NextResponse.json({ institutions: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "nao-autenticado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const name = cleanInstitutionName(String(body.name ?? ""));
  const normalizedName = normalizeInstitutionName(name);

  if (name.length < 2 || normalizedName.length < 2) {
    return NextResponse.json({ error: "nome-invalido" }, { status: 400 });
  }

  const { data: similar } = await supabase
    .from("institutions")
    .select("id,name,status")
    .or(`normalized_name.eq.${normalizedName},name.ilike.%${name}%`)
    .limit(1)
    .maybeSingle();

  if (similar) {
    return NextResponse.json({
      duplicate: true,
      institution: similar,
      message: `Você quis dizer: ${similar.name}`
    }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("institutions")
    .insert({
      name,
      normalized_name: normalizedName,
      status: "pending",
      created_by: userData.user.id
    })
    .select("id,name,status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ institution: data });
}
