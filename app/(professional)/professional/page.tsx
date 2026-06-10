import Link from "next/link";
import { MapPin } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

type ProcessRow = {
  id: string;
  status: string;
  demand: { title: string } | { title: string }[] | null;
};

type DemandRow = {
  id: string;
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

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProfessionalHomePage() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const [{ data: professional }, { data: notifications }, { data: demands }] = await Promise.all([
    supabase.from("professionals").select("id,full_name,desired_role,city,state,status").eq("user_id", userData.user?.id).maybeSingle(),
    supabase.from("notifications").select("id,title,created_at,read_at").eq("user_id", userData.user?.id).order("created_at", { ascending: false }).limit(4),
    supabase.from("demands").select("id,title,description,city,state,modality,contract_type,openings,created_at,company:companies(trade_name,segment)").in("status", ["active", "screening"]).order("created_at", { ascending: false }).limit(80)
  ]);

  const { data: processes } = professional?.id
    ? await supabase.from("screening_processes").select("id,status,demand:demands(title)").eq("professional_id", professional.id).order("updated_at", { ascending: false }).limit(4)
    : { data: [] };
  const { data: preferredCities } = professional?.id ? await supabase.from("professional_preferred_cities").select("city,state").eq("professional_id", professional.id) : { data: [] };
  const preferredSet = new Set((preferredCities ?? []).map((item) => `${item.city.toLowerCase()}|${item.state.toUpperCase()}`));

  return (
    <AppShell eyebrow="Profissional" title="Minha Area">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">Perfil profissional</p>
          <h2 className="mt-2 text-2xl font-semibold">{professional?.full_name ?? "Complete seu cadastro"}</h2>
          <p className="mt-2 text-sm text-slate-600">{professional?.desired_role ?? "Cargo desejado nao informado"} · {professional?.city ?? "Cidade"}/{professional?.state ?? "UF"}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/professional/profile" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Editar perfil</Link>
            <Link href="/professional/resume" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Curriculo</Link>
            <Link href="/professional/screening-status" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Status de triagem</Link>
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Notificacoes recentes</h2>
          <div className="mt-4 space-y-3">
            {(notifications ?? []).length === 0 ? <p className="text-sm text-slate-500">Nenhuma notificacao por enquanto.</p> : null}
            {(notifications ?? []).map((notification) => (
              <div key={notification.id} className="rounded-md bg-slate-50 p-3 text-sm">
                <p className="font-medium">{notification.title}</p>
                <p className="mt-1 text-xs text-slate-500">{notification.read_at ? "Lida" : "Nao lida"}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-700">Vagas disponiveis</p>
              <h2 className="mt-1 text-xl font-semibold">Vagas das empresas cadastradas</h2>
            </div>
            <Link href="/professional/profile" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Editar cidades</Link>
          </div>
          <div className="grid gap-3">
            {((demands ?? []) as unknown as DemandRow[]).map((demand) => {
              const company = one(demand.company);
              const isPreferred = preferredSet.has(`${demand.city.toLowerCase()}|${demand.state.toUpperCase()}`);

              return (
                <article key={demand.id} className="border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">{demand.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{company?.trade_name ?? "Empresa cadastrada"}{company?.segment ? ` · ${company.segment}` : ""}</p>
                    </div>
                    {isPreferred ? <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">Cidade de interesse</span> : null}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{demand.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1 bg-white px-2 py-1"><MapPin aria-hidden="true" size={13} /> {demand.city}/{demand.state}</span>
                    <span className="bg-white px-2 py-1">{demand.modality}</span>
                    <span className="bg-white px-2 py-1">{demand.contract_type}</span>
                    <span className="bg-white px-2 py-1">{demand.openings} vaga(s)</span>
                  </div>
                </article>
              );
            })}
            {(demands ?? []).length === 0 ? <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">Nenhuma vaga ativa encontrada no momento.</p> : null}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Processos em andamento</h2>
            <Link href="/professional/referrals" className="text-sm font-semibold text-blue-700">Ver encaminhamentos</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Oportunidade</th><th>Status</th></tr></thead>
              <tbody>
                {((processes ?? []) as unknown as ProcessRow[]).map((process) => (
                  <tr key={process.id}>
                    <td>{one(process.demand)?.title ?? "Demanda em triagem"}</td>
                    <td>{process.status}</td>
                  </tr>
                ))}
                {(processes ?? []).length === 0 ? <tr><td colSpan={2}>Nenhum processo encontrado.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
