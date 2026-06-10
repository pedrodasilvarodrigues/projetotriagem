import { defaultRouteForRole } from "@/lib/auth/routes";

type SupabaseLike = {
  from: (table: string) => any;
};

function metadataRole(value: unknown) {
  return value === "company" || value === "professional" ? value : null;
}

async function persistRole(supabase: SupabaseLike, userId: string, role: "company" | "professional") {
  await supabase.from("user_roles").upsert({ user_id: userId, role });
  return defaultRouteForRole(role);
}

export async function resolveAuthenticatedEntryPath(supabase: SupabaseLike, userId: string, userMetadata?: Record<string, unknown>, preferredRole?: "company" | "professional" | null) {
  const { data: roleRecord } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  const savedRole = roleRecord?.role;

  if (savedRole === "admin" || savedRole === "company" || savedRole === "professional") {
    return defaultRouteForRole(savedRole);
  }

  if (preferredRole) {
    return persistRole(supabase, userId, preferredRole);
  }

  const roleFromMetadata = metadataRole(userMetadata?.role);
  if (roleFromMetadata) {
    return persistRole(supabase, userId, roleFromMetadata);
  }

  const [{ data: company }, { data: professional }] = await Promise.all([
    supabase.from("companies").select("id").eq("owner_id", userId).maybeSingle(),
    supabase.from("professionals").select("id").eq("user_id", userId).maybeSingle()
  ]);

  if (company) {
    return persistRole(supabase, userId, "company");
  }

  if (professional) {
    return persistRole(supabase, userId, "professional");
  }

  return persistRole(supabase, userId, "professional");
}
