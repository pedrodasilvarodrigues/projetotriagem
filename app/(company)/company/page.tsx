import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

type CandidateRow = {
  id: string;
  full_name: string;
  desired_role: string;
  city: string;
  state: string;
  education_level: string;
  status: string;
};

export default async function CompanyHomePage() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: company } = await supabase.from("companies").select("id,trade_name,city,state,status").eq("owner_id", userData.user?.id).maybeSingle();
  const [{ count: activeDemands }, { count: candidatesInProcess }, { data: professionals }] = company?.id
    ? await Promise.all([
        supabase.from("demands").select("id", { count: "exact", head: true }).eq("company_id", company.id).in("status", ["active", "screening"]),
        supabase.from("screening_processes").select("id,demand:demands!inner(company_id)", { count: "exact", head: true }).eq("demand.company_id", company.id),
        supabase.from("professionals").select("id,full_name,desired_role,city,state,education_level,status").is("deleted_at", null).order("updated_at", { ascending: false }).limit(8)
      ])
    : [{ count: 0 }, { count: 0 }, { data: [] }];

  return (
    <AppShell eyebrow="Empresa" title="Minha Empresa">
      <div className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">Area empresarial</p>
          <h2 className="mt-2 text-2xl font-semibold">{company?.trade_name ?? "Empresa"}</h2>
          <p className="mt-2 text-sm text-slate-600">{company?.city ?? "Cidade"}/{company?.state ?? "UF"} · {company?.status ?? "pending"}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-slate-50 p-4"><strong className="text-2xl">{activeDemands ?? 0}</strong><p className="text-sm text-slate-600">Demandas ativas</p></div>
            <div className="rounded-md bg-slate-50 p-4"><strong className="text-2xl">{candidatesInProcess ?? 0}</strong><p className="text-sm text-slate-600">Candidatos em processo</p></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/company/demands/new" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Criar demanda</Link>
            <Link href="/company/candidates" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Analise de candidatos</Link>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-700">Analise de candidatos</p>
              <h3 className="mt-1 text-xl font-semibold">Profissionais cadastrados no portal</h3>
            </div>
            <Link href="/company/candidates" className="text-sm font-semibold text-blue-700 hover:underline">Ver todos</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Candidato</th><th>Objetivo</th><th>Local</th><th>Escolaridade</th><th>Status</th></tr></thead>
              <tbody>
                {((professionals ?? []) as unknown as CandidateRow[]).map((candidate) => (
                  <tr key={candidate.id}>
                    <td>{candidate.full_name}</td>
                    <td>{candidate.desired_role}</td>
                    <td>{candidate.city}/{candidate.state}</td>
                    <td>{candidate.education_level}</td>
                    <td>{candidate.status}</td>
                  </tr>
                ))}
                {(professionals ?? []).length === 0 ? <tr><td colSpan={5}>Nenhum candidato cadastrado ainda.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
