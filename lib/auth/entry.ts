import { defaultRouteForRole } from "@/lib/auth/routes";

type SupabaseLike = {
  from: (table: string) => any;
};

type AppRole = "company" | "professional";

function onboardingRouteForRole(role: "company" | "professional") {
  return role === "company" ? "/onboarding/company" : "/onboarding/professional";
}

async function persistRole(supabase: SupabaseLike, userId: string, role: "company" | "professional", nextPath = defaultRouteForRole(role)) {
  await supabase.from("user_roles").upsert({ user_id: userId, role });
  return nextPath;
}

function metadataRole(userMetadata?: Record<string, unknown>, preferredRole?: "company" | "professional" | null): AppRole | null {
  if (preferredRole) return preferredRole;

  const rawRole = userMetadata?.role;
  // user_metadata is controlled by the user. It may guide onboarding, but it
  // must never grant an administrative role.
  if (rawRole === "company" || rawRole === "professional") {
    return rawRole;
  }

  return null;
}

export async function resolveAuthenticatedEntryPath(
  supabase: SupabaseLike,
  userId: string,
  userMetadata?: Record<string, unknown>,
  preferredRole?: "company" | "professional" | null
) {
  const [{ data: roleRecord }, { data: company }, { data: professional }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
    supabase.from("companies").select("id").eq("owner_id", userId).maybeSingle(),
    supabase.from("professionals").select("id").eq("user_id", userId).maybeSingle()
  ]);
  const savedRole = roleRecord?.role;

  if (savedRole === "admin") {
    return defaultRouteForRole(savedRole);
  }

  if (company) {
    if (savedRole !== "company") await supabase.from("user_roles").upsert({ user_id: userId, role: "company" });
    return defaultRouteForRole("company");
  }

  if (professional) {
    if (savedRole !== "professional") await supabase.from("user_roles").upsert({ user_id: userId, role: "professional" });
    return defaultRouteForRole("professional");
  }

  if (savedRole === "company" || savedRole === "professional") {
    return defaultRouteForRole(savedRole);
  }

  const inferredRole = metadataRole(userMetadata, preferredRole);
  if (inferredRole === "company" || inferredRole === "professional") {
    return persistRole(supabase, userId, inferredRole, defaultRouteForRole(inferredRole));
  }

  return "/onboarding";
}
