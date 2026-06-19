import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminHomePage() {
  const supabase = await createServerClient();
  const [{ count: candidates }, { count: companies }, { count: demands }, { count: referrals }, { count: hirings }] = await Promise.all([
    supabase.from("professionals").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("demands").select("id", { count: "exact", head: true }).in("status", ["active", "screening"]),
    supabase.from("screening_processes").select("id", { count: "exact", head: true }).in("status", ["forwarded", "interview"]),
    supabase.from("screening_processes").select("id", { count: "exact", head: true }).eq("status", "hired")
  ]);

  const cards = [
    ["Novos candidatos", candidates ?? 0, "/admin/new-candidates"],
    ["Empresas cadastradas", companies ?? 0, "/admin/companies"],
    ["Demandas abertas", demands ?? 0, "/admin/demands"],
    ["Encaminhamentos", referrals ?? 0, "/admin/referrals"],
    ["Contratacoes", hirings ?? 0, "/admin/hirings"]
  ] as const;

  return (
    <AppShell eyebrow="Administrador" title="Dashboard">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value, href]) => (
          <Link key={label} href={href} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <strong className="block text-2xl font-semibold sm:text-3xl">{value}</strong>
            <span className="mt-2 block text-sm text-slate-600">{label}</span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
