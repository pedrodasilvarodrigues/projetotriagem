import Link from "next/link";
import { Building2, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

type DemandRow = {
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

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function normalize(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function containsText(source: string | null | undefined, query: string) {
  return !query || normalize(source).includes(query);
}

const modalityLabels: Record<string, string> = {
  presencial: "Presencial",
  hibrido: "Hibrido",
  remoto: "Remoto"
};

const contractLabels: Record<string, string> = {
  clt: "CLT",
  pj: "PJ",
  temporario: "Temporario",
  estagio: "Estagio",
  aprendiz: "Aprendiz"
};

export default async function ProfessionalSearchDemandsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; local?: string; modalidade?: string }>;
}) {
  const params = await searchParams;
  const query = normalize(params.q);
  const local = normalize(params.local);
  const modality = params.modalidade && ["presencial", "hibrido", "remoto"].includes(params.modalidade) ? params.modalidade : "";
  const supabase = await createServerClient();
  const { data: demands } = await supabase
    .from("demands")
    .select("id,name,title,description,city,state,modality,contract_type,openings,created_at,company:companies(trade_name,segment)")
    .in("status", ["active", "screening"])
    .order("created_at", { ascending: false })
    .limit(120);

  const filteredDemands = ((demands ?? []) as unknown as DemandRow[]).filter((demand) => {
    const company = one(demand.company);
    const matchesQuery =
      containsText(demand.name, query) ||
      containsText(demand.title, query) ||
      containsText(demand.description, query) ||
      containsText(company?.trade_name, query) ||
      containsText(company?.segment, query);
    const matchesLocal =
      !local ||
      normalize(`${demand.city}/${demand.state}`).includes(local) ||
      normalize(demand.city).includes(local) ||
      normalize(demand.state).includes(local);
    const matchesModality = !modality || demand.modality === modality;
    return matchesQuery && matchesLocal && matchesModality;
  });

  return (
    <AppShell eyebrow="Profissional" title="Buscar demandas">
      <div className="space-y-5">
        <section className="border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-blue-700">Buscar demandas</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Todas as vagas abertas das empresas cadastradas</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Aqui voce consegue visualizar empresas, nome da demanda, cargo, local e modalidade em uma lista unica.
              </p>
            </div>
            <Link href="/professional" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Voltar para minha area
            </Link>
          </div>

          <form className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_220px_150px]" action="/professional/search-demands">
            <label className="text-sm font-semibold text-slate-700">
              O que?
              <span className="mt-2 flex items-center gap-2 border border-slate-300 bg-slate-50 px-3 py-2.5 focus-within:border-blue-700 focus-within:bg-white">
                <Search aria-hidden="true" className="text-slate-400" size={17} />
                <input name="q" defaultValue={params.q ?? ""} placeholder="Nome da demanda, cargo ou empresa" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </span>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Onde?
              <span className="mt-2 flex items-center gap-2 border border-slate-300 bg-slate-50 px-3 py-2.5 focus-within:border-blue-700 focus-within:bg-white">
                <MapPin aria-hidden="true" className="text-slate-400" size={17} />
                <input name="local" defaultValue={params.local ?? ""} placeholder="Cidade ou UF" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </span>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Modelo
              <select name="modalidade" defaultValue={modality} className="field-input mt-2 h-[42px]">
                <option value="">Todos</option>
                <option value="presencial">Presencial</option>
                <option value="hibrido">Hibrido</option>
                <option value="remoto">Remoto</option>
              </select>
            </label>
            <button type="submit" className="mt-auto inline-flex h-[42px] items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white">
              <SlidersHorizontal aria-hidden="true" size={16} />
              Filtrar
            </button>
          </form>
        </section>

        <section className="border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-700">Resultados</p>
              <h2 className="mt-1 text-xl font-semibold">{filteredDemands.length} demanda(s) encontrada(s)</h2>
            </div>
          </div>

          <div className="space-y-3">
            {filteredDemands.map((demand) => {
              const company = one(demand.company);

              return (
                <article key={demand.id} className="border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-blue-700">{demand.name ?? "Demanda ativa"}</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">{demand.title}</h3>
                      <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-600">
                        <Building2 aria-hidden="true" size={14} />
                        {company?.trade_name ?? "Empresa cadastrada"}
                        {company?.segment ? ` · ${company.segment}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                      <span className="bg-white px-2 py-1">{demand.city}/{demand.state}</span>
                      <span className="bg-white px-2 py-1">{modalityLabels[demand.modality] ?? demand.modality}</span>
                      <span className="bg-white px-2 py-1">{contractLabels[demand.contract_type] ?? demand.contract_type}</span>
                      <span className="bg-white px-2 py-1">{demand.openings} vaga(s)</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{demand.description}</p>
                </article>
              );
            })}

            {filteredDemands.length === 0 ? <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">Nenhuma demanda encontrada com esses filtros.</p> : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
