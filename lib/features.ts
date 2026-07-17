import { createServerClient } from "@/lib/supabase/server";

export async function isMarketplaceEnabled() {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("is_feature_enabled", { feature_key: "marketplace_services" });
  if (error) {
    console.error("[features] Não foi possível consultar marketplace_services", error.message);
    return false;
  }
  return data === true;
}
