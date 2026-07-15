import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, Clock, FileText, MapPin, Search, SlidersHorizontal, Sparkles, UserRoundCheck } from "lucide-react";
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
  company: { trade_name: string | null } | { trade_name: string | null }[] | null;
};

const modalityLabels: Record<string, string> = {
  presencial: "Presencial",
  hibrido: "Híbrido",
  remoto: "Remoto"
};

const contractLabels: Record<string, string> = {
  clt: "CLT",
  pj: "PJ",
  temporario: "Temporário",
  estagio: "Estágio",
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
      .select("id,title,description,city,state,modality,contract_type,openings,created_at,company:companies(trade_name)")
      .is("deleted_at", null)
      .in("status", ["active", "screening"])
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
    const label = demand.title.split(/\s+/).slice(0, 2).join(" ") || "Oportunidades";
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
    const matchesQuery = containsText(demand.title, query) || containsText(demand.description, query) || containsText(company?.trade_name, query);
    const matchesLocal = !local || normalize(`${demand.city}/${demand.state}`).includes(local) || normalize(demand.city).includes(local) || normalize(demand.state).includes(local);
    const matchesModality = !modality || demand.modality === modality;
    return matchesQuery && matchesLocal && matchesModality;
  });
  const buckets = areaBuckets(demands);
  const totalOpenings = demands.reduce((sum, demand) => sum + Number(demand.openings || 0), 0);

  return (
    <PublicPageShell
      eyebrow="Vagas públicas"
      title="Encontre uma oportunidade e deixe seu currículo pronto para a triagem."
      description="Veja demandas abertas por empresas cadastradas. O cadastro profissional aumenta suas chances de ser encontrado, analisado e encaminhado quando houver compatibilidade."
    >
      <div className="space-y-8">
        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Demandas abertas", value: demands.length, icon: BriefcaseBusiness },
            { label: "Vagas disponíveis", value: totalOpenings, icon: UserRoundCheck },
            { label: "Áreas mapeadas", value: buckets.length, icon: Sparkles }
          ].map((item) => (
            <div key={item.label} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-slate-500">{item.label}</span>
                <span className="flex size-10 items-center justify-center rounded-2xl bg-[#F2811D]/10 text-[#F2811D]">
                  <item.icon aria-hidden="true" size={19} />
                </span>
              </div>
              <strong className="mt-3 block font-display text-4xl font-extrabold text-[#0F2D4E]">{item.value}</strong>
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-[#F2811D]">Buscar oportunidades</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-[#0F2D4E]">Filtre por cargo, empresa, cidade ou modelo</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Mesmo que não encontre a vaga perfeita agora, cadastre seu currículo para futuras demandas.</p>
            </div>
            <p className="rounded-2xl bg-[#0F2D4E] px-4 py-2 text-sm font-extrabold text-white">{filtered.length} de {demands.length} demanda(s)</p>
          </div>

          <form className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_220px_150px]" action="/vagas-publicas">
            <label className="text-sm font-bold text-slate-700">
              O que?
              <span className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-300 bg-[#FAFBFC] px-3 py-2.5 transition focus-within:border-[#F2811D] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(242,129,29,0.12)]">
                <Search aria-hidden="true" className="text-slate-400" size={17} />
                <input name="q" defaultValue={params.q ?? ""} placeholder="Cargo, área ou empresa" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </span>
            </label>
            <label className="text-sm font-bold text-slate-700">
              Onde?
              <span className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-300 bg-[#FAFBFC] px-3 py-2.5 transition focus-within:border-[#F2811D] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(242,129,29,0.12)]">
                <MapPin aria-hidden="true" className="text-slate-400" size={17} />
                <input name="local" defaultValue={params.local ?? ""} placeholder="Cidade ou UF" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </span>
            </label>
            <label className="text-sm font-bold text-slate-700">
              Modelo
              <select name="modalidade" defaultValue={modality} className="field-input mt-2 h-[46px]">
                <option value="">Todos</option>
                <option value="presencial">Presencial</option>
                <option value="hibrido">Híbrido</option>
                <option value="remoto">Remoto</option>
              </select>
            </label>
            <button type="submit" className="btn-primary mt-auto h-[46px] rounded-2xl px-4 text-sm">
              <SlidersHorizontal aria-hidden="true" size={16} />
              Filtrar
            </button>
          </form>
        </section>

        {buckets.length > 0 ? (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-wide text-[#F2811D]">Mapa de oportunidades</p>
                <h2 className="mt-1 font-display text-xl font-extrabold text-[#0F2D4E]">Áreas com demandas abertas</h2>
              </div>
              <Sparkles aria-hidden="true" size={24} className="text-[#F2811D]" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {buckets.map((bucket) => (
                <Link key={bucket.label} href={`/vagas-publicas?q=${encodeURIComponent(bucket.label)}`} className="group rounded-2xl border border-slate-200 bg-[#FAFBFC] p-4 transition hover:-translate-y-0.5 hover:border-[#F2811D]/40 hover:bg-white hover:shadow-lg">
                  <strong className="block text-sm font-extrabold text-[#0F2D4E]">{bucket.label}</strong>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-slate-600">
                    {bucket.count} demanda(s)
                    <ArrowRight aria-hidden="true" className="transition group-hover:translate-x-1" size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-2">
          {filtered.map((demand) => {
            const company = one(demand.company);
            return (
              <article key={demand.id} className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F2811D]/40 hover:shadow-2xl hover:shadow-[#0F2D4E]/8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F2811D]/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#B5520C]">
                      <Clock aria-hidden="true" size={13} />
                      Publicada em {new Date(demand.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    <h2 className="mt-3 font-display text-xl font-extrabold text-[#0F2D4E]">{demand.title}</h2>
                    <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-slate-600">
                      <Building2 aria-hidden="true" size={15} />
                      {company?.trade_name ?? "Empresa cadastrada"}
                    </p>
                  </div>
                  <span className="rounded-2xl bg-[#0F2D4E] px-3 py-2 text-xs font-extrabold text-white">{demand.openings} vaga(s)</span>
                </div>
                {demand.description ? <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600">{demand.description}</p> : null}
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F1F4F8] px-3 py-1.5"><MapPin aria-hidden="true" size={13} /> {demand.city}/{demand.state}</span>
                  <span className="rounded-full bg-[#F1F4F8] px-3 py-1.5">{modalityLabels[demand.modality] ?? demand.modality}</span>
                  <span className="rounded-full bg-[#F1F4F8] px-3 py-1.5">{contractLabels[demand.contract_type] ?? demand.contract_type}</span>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href="/register" className="btn-primary rounded-2xl px-4 py-2.5 text-sm">
                    Cadastrar currículo
                    <ArrowRight aria-hidden="true" size={16} />
                  </Link>
                  <Link href="/login" className="btn-secondary rounded-2xl bg-white px-4 py-2.5 text-sm">Já tenho cadastro</Link>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-[#1B4E78]/25 bg-white p-8 text-center lg:col-span-2">
              <FileText aria-hidden="true" className="mx-auto text-[#F2811D]" size={36} />
              <h2 className="mt-4 font-display text-2xl font-extrabold text-[#0F2D4E]">Nenhuma vaga encontrada com esses filtros.</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Cadastre seu perfil mesmo assim. Novas demandas podem surgir, e um currículo completo ajuda a equipe a identificar compatibilidade mais rápido.
              </p>
              <Link href="/register" className="btn-primary mt-6 rounded-2xl px-5 py-3 text-sm">
                Criar cadastro profissional
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
            </div>
          ) : null}
        </section>

        <section className="rounded-[2rem] border border-[#F2811D]/20 bg-[#F2811D]/10 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#F2811D] shadow-sm">
                <CheckCircle2 aria-hidden="true" size={23} />
              </span>
              <div>
                <h2 className="font-display text-xl font-extrabold text-[#0F2D4E]">Seu currículo aumenta a qualidade da triagem</h2>
                <p className="mt-1 text-sm leading-7 text-slate-700">Com cadastro completo, o portal cruza perfil, cidade, experiências e cursos antes do encaminhamento.</p>
              </div>
            </div>
            <Link href="/register" className="btn-primary rounded-2xl px-5 py-3 text-sm">Começar agora</Link>
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}
