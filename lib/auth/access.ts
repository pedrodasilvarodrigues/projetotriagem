import { redirect } from "next/navigation";
import { resolveAuthenticatedEntryPath } from "@/lib/auth/entry";
import { defaultRouteForRole } from "@/lib/auth/routes";
import { createServerClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "company" | "professional";
export { defaultRouteForRole };

export async function getCurrentRole() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: roleRecord } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle();
  if (roleRecord?.role) return roleRecord.role as AppRole;

  const entryPath = await resolveAuthenticatedEntryPath(supabase, data.user.id, data.user.user_metadata);
  if (!entryPath) redirect("/login?error=conta-nao-cadastrada");

  if (entryPath === "/admin") return "admin";
  if (entryPath === "/company") return "company";
  return "professional";
}

export async function requireRole(expectedRole: AppRole) {
  const role = await getCurrentRole();
  if (role !== expectedRole) {
    redirect(`/acesso-negado?role=${encodeURIComponent(role ?? "sem-perfil")}`);
  }
  return role;
}

export function roleFromEyebrow(eyebrow: string): AppRole | undefined {
  if (eyebrow === "Administrador") return "admin";
  if (eyebrow === "Empresa") return "company";
  if (eyebrow === "Profissional") return "professional";
  return undefined;
}
