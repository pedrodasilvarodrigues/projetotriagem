import { requireRole } from "@/lib/auth/access";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export type ProfessionalDemandCatalogRow = {
  id: string;
  name: string | null;
  title: string;
  description: string;
  city: string;
  state: string;
  modality: string;
  contract_type: string;
  openings: number;
  created_at: string;
  company: { trade_name: string; segment: string | null } | { trade_name: string; segment: string | null }[] | null;
};

export async function listProfessionalDemands(limit = 120): Promise<ProfessionalDemandCatalogRow[]> {
  await requireRole("professional");

  const supabase = hasSupabaseAdminEnv() ? createAdminClient() : await createServerClient();
  const { data, error } = await supabase
    .from("demands")
    .select("id,name,title,description,city,state,modality,contract_type,openings,created_at,company:companies(trade_name,segment)")
    .in("status", ["active", "screening"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[demands] Falha ao carregar catálogo profissional", { error: error.message });
    return [];
  }

  return (data ?? []) as unknown as ProfessionalDemandCatalogRow[];
}
