import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

export default async function CompanyHomePage() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: company } = await supabase.from("companies").select("id,trade_name,city,state,status").eq("owner_id", userData.user?.id).maybeSingle();
  const [{ count: activeDemands }, { count: candidates }] = company?.id
    ? await Promise.all([
        supabase.from("demands").select("id", { count: "exact", head: true }).eq("company_id", company.id).in("status", ["active", "screening"]),
        supabase.from("screening_processes").select("id,demand:demands!inner(company_id)", { count: "exact", head: true }).eq("demand.company_id", company.id)
      ])
    : [{ count: 0 }, { count: 0 }];

  return (
    <AppShell eyebrow="Empresa" title="Minha Empresa">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-blue-700">Area empresarial</p>
        <h2 className="mt-2 text-2xl font-semibold">{company?.trade_name ?? "Empresa"}</h2>
        <p className="mt-2 text-sm text-slate-600">{company?.city ?? "Cidade"}/{company?.state ?? "UF"} · {company?.status ?? "pending"}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-slate-50 p-4"><strong className="text-2xl">{activeDemands ?? 0}</strong><p className="text-sm text-slate-600">Demandas ativas</p></div>
          <div className="rounded-md bg-slate-50 p-4"><strong className="text-2xl">{candidates ?? 0}</strong><p className="text-sm text-slate-600">Candidatos em processo</p></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/company/demands/new" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Criar demanda</Link>
          <Link href="/company/candidates" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Candidatos encaminhados</Link>
        </div>
      </section>
    </AppShell>
  );
}
