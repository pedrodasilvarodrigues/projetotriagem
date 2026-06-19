import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";
import { statusLabel } from "@/lib/status-labels";

type CandidateRow = {
  id: string;
  full_name: string;
  desired_role: string;
  city: string;
  state: string;
  education_level: string;
  status: string;
};

type PresentedCandidateRow = {
  id: string;
  status: string;
  professional: CandidateRow | CandidateRow[] | null;
  demand: { name: string | null; title: string; company_id: string } | Array<{ name: string | null; title: string; company_id: string }> | null;
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CompanyHomePage() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: company } = await supabase.from("companies").select("id,trade_name,city,state,status").eq("owner_id", userData.user?.id).maybeSingle();
  const [{ count: activeDemands }, { count: candidatesInProcess }, { data: presentedCandidates }] = company?.id
    ? await Promise.all([
        supabase.from("demands").select("id", { count: "exact", head: true }).eq("company_id", company.id).in("status", ["active", "screening"]),
        supabase.from("screening_processes").select("id,demand:demands!inner(company_id)", { count: "exact", head: true }).eq("demand.company_id", company.id),
        supabase
          .from("screening_processes")
          .select("id,status,updated_at,demand:demands!inner(name,title,company_id),professional:professionals!inner(id,full_name,desired_role,city,state,education_level,status)")
          .eq("demand.company_id", company.id)
          .neq("status", "waiting")
          .order("updated_at", { ascending: false })
          .limit(8)
      ])
    : [{ count: 0 }, { count: 0 }, { data: [] }];

  return (
    <AppShell eyebrow="Empresa" title="Minha Empresa">
      <div className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">Área empresarial</p>
          <h2 className="mt-2 text-2xl font-semibold">{company?.trade_name ?? "Empresa"}</h2>
          <p className="mt-2 text-sm text-slate-600">{company?.city ?? "Cidade"}/{company?.state ?? "UF"} · {statusLabel(company?.status ?? "pending")}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-slate-50 p-4"><strong className="text-2xl">{activeDemands ?? 0}</strong><p className="text-sm text-slate-600">Demandas ativas</p></div>
            <div className="rounded-md bg-slate-50 p-4"><strong className="text-2xl">{candidatesInProcess ?? 0}</strong><p className="text-sm text-slate-600">Candidatos em processo</p></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/company/demands/new" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Criar demanda</Link>
            <Link href="/company/candidates" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Análise de candidatos</Link>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-700">Análise de candidatos</p>
              <h3 className="mt-1 text-xl font-semibold">Profissionais apresentados pelo administrador</h3>
            </div>
            <Link href="/company/candidates" className="text-sm font-semibold text-blue-700 hover:underline">Ver todos</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Candidato</th><th>Objetivo</th><th>Demanda</th><th>Escolaridade</th><th>Situação</th></tr></thead>
              <tbody>
                {((presentedCandidates ?? []) as unknown as PresentedCandidateRow[]).map((process) => {
                  const candidate = one(process.professional);
                  const demand = one(process.demand);
                  if (!candidate || !demand) return null;
                  return (
                    <tr key={process.id}>
                      <td>{candidate.full_name}</td>
                      <td>{candidate.desired_role}</td>
                      <td>{demand.name ?? demand.title}</td>
                      <td>{candidate.education_level}</td>
                      <td>{statusLabel(process.status)}</td>
                    </tr>
                  );
                })}
                {(presentedCandidates ?? []).length === 0 ? <tr><td colSpan={5}>Nenhum candidato apresentado ainda.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
