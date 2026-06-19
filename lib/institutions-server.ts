import { cleanInstitutionName, normalizeInstitutionName } from "@/lib/institutions";

type SupabaseLike = {
  from: (table: string) => any;
};

export async function ensureInstitutionName(supabase: SupabaseLike, userId: string | undefined | null, value?: string | null) {
  const name = cleanInstitutionName(value ?? "");
  const normalizedName = normalizeInstitutionName(name);
  if (name.length < 2 || normalizedName.length < 2) return name || null;

  const { data: existing } = await supabase
    .from("institutions")
    .select("id,name,status")
    .eq("normalized_name", normalizedName)
    .maybeSingle();

  if (existing?.name) return existing.name;

  const { data: similar } = await supabase
    .from("institutions")
    .select("id,name,status")
    .ilike("name", `%${name}%`)
    .limit(1)
    .maybeSingle();

  if (similar?.name) return similar.name;

  await supabase.from("institutions").insert({
    name,
    normalized_name: normalizedName,
    status: "pending",
    created_by: userId ?? null
  });

  return name;
}
