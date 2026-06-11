import Link from "next/link";
import { BriefcaseBusiness, Building2, MapPin, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { PublicPageShell } from "@/components/app/public-page-shell";
import { createAdminClient } from "@/lib/supabase/admin";

type DemandRow = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  state: string;
  modality: string;
  contract_type: string;
  openings: number;
  created_at: string;
  company: { trade_name: string | null; segment: string | null } | { trade_name: string | null; segment: string | null }[] | null;
};

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

async function getDemands() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("demands")
      .select("id,title,description,city,state,modality,contract_type,openings,created_at,company:companies(trade_name,segment)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(80);
    return (data ?? []) as unknown as DemandRow[];
  } catch {
    return [];
  }
}

function areaBuckets(demands: DemandRow[]) {
  const buckets = new Map<string, number>();

  demands.forEach((demand) => {
    const company = one(demand.company);
    const label = company?.segment || demand.title.split(/\s+/).slice(0, 2).join(" ") || "Oportunidades";
    buckets.set(label, (buckets.get(label) ?? 0) + 1);
  });

  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }));
}

export default async function PublicJobsPage({ searchParams }: { searchParams: Promise<{ q?: string; local?: string; modalidade?: string }> }) {
  const params = await searchParams;
  const query = normalize(params.q);
  const local = normalize(params.local);
  const modality = params.modalidade && ["presencial", "hibrido", "remoto"].includes(params.modalidade) ? params.modalidade : "";
  const demands = await getDemands();
  const filtered = demands.filter((demand) => {
    const company = one(demand.company);
    const matchesQuery = containsText(demand.title, query) || containsText(demand.description, query) || containsText(company?.trade_name, query) || containsText(company?.segment, query);
    const matchesLocal = !local || normalize(`${demand.city}/${demand.state}`).includes(local) || normalize(demand.city).includes(local) || normalize(demand.state).includes(local);
    const matchesModality = !modality || demand.modality === modality;
    return matchesQuery && matchesLocal && matchesModality;
  });
  const buckets = areaBuckets(demands);

  return (
    <PublicPageShell title="Vagas Publicas" description="Oportunidades abertas por empresas cadastradas, com cadastro profissional para triagem e encaminhamento.">
      <div className="space-y-6">
        <section className="border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">Buscar oportunidades</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">Procure por cargo, empresa ou cidade</h2>
            </div>
            <p className="rounded-md bg-blue-50 px-3 py-2 text-sm font-bold text-blue-800">{filtered.length} de {demands.length} vaga(s)</p>
          </div>
          <form className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_220px_150px]" action="/vagas-publicas">
            <label className="text-sm font-semibold text-slate-700">
              O que?
              <span className="mt-2 flex items-center gap-2 border border-slate-300 bg-slate-50 px-3 py-2.5 focus-within:border-blue-700 focus-within:bg-white">
                <Search aria-hidden="true" className="text-slate-400" size={17} />
                <input name="q" defaultValue={params.q ?? ""} placeholder="Cargo, area ou empresa" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
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

        {buckets.length > 0 ? (
          <section className="border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles aria-hidden="true" size={18} className="text-blue-700" />
              <h2 className="text-base font-semibold">Areas com oportunidades</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {buckets.map((bucket) => (
                <Link key={bucket.label} href={`/vagas-publicas?q=${encodeURIComponent(bucket.label)}`} className="border border-slate-200 bg-slate-50 p-4 hover:border-blue-200 hover:bg-blue-50">
                  <strong className="block text-sm text-slate-950">{bucket.label}</strong>
                  <span className="mt-1 block text-sm text-slate-600">{bucket.count} vaga(s)</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          {filtered.map((demand) => {
            const company = one(demand.company);
            return (
              <article key={demand.id} className="border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">{demand.title}</h2>
                    <p className="mt-2 inline-flex items-center gap-1 text-sm text-slate-600">
                      <Building2 aria-hidden="true" size={14} />
                      {company?.trade_name ?? "Empresa cadastrada"}{company?.segment ? ` · ${company.segment}` : ""}
                    </p>
                  </div>
                  <span className="rounded-md bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">{demand.openings} vaga(s)</span>
                </div>
                {demand.description ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{demand.description}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-1"><MapPin aria-hidden="true" size={13} /> {demand.city}/{demand.state}</span>
                  <span className="bg-slate-50 px-2 py-1">{modalityLabels[demand.modality] ?? demand.modality}</span>
                  <span className="bg-slate-50 px-2 py-1">{contractLabels[demand.contract_type] ?? demand.contract_type}</span>
                  <span className="bg-slate-50 px-2 py-1">{new Date(demand.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href="/register" className="inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Cadastrar perfil</Link>
                  <Link href="/login" className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Ja tenho cadastro</Link>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
              Nenhuma vaga encontrada com esses filtros. Cadastre seu perfil para receber oportunidades compativeis quando novas demandas forem abertas.
              <Link href="/register" className="mt-4 inline-flex rounded-md bg-blue-700 px-4 py-2 font-semibold text-white">Criar cadastro</Link>
            </div>
          ) : null}
        </section>

        <section className="border border-blue-100 bg-blue-50 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-blue-700">
                <BriefcaseBusiness aria-hidden="true" size={20} />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">Seu curriculo aumenta a qualidade da triagem</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Com cadastro completo, o portal cruza perfil, cidade, experiencias e cursos antes do encaminhamento.</p>
              </div>
            </div>
            <Link href="/register" className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Comecar agora</Link>
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}
