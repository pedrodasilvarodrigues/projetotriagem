import Link from "next/link";
import { Bell, BriefcaseBusiness, Building2, CheckCircle2, Clock3, FileText, MapPin, Search, SlidersHorizontal, Sparkles, Target } from "lucide-react";
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

type PreferredCityRow = { city: string; state: string };
type CompanySummary = { trade_name: string; segment: string | null };

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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function demandScore(demand: DemandRow, professional?: { desired_role?: string | null; city?: string | null; state?: string | null } | null, preferredSet?: Set<string>) {
  const desiredRole = normalize(professional?.desired_role);
  const title = normalize(demand.title);
  const description = normalize(demand.description);
  const sameCity = normalize(demand.city) === normalize(professional?.city) && normalize(demand.state) === normalize(professional?.state);
  const sameState = normalize(demand.state) === normalize(professional?.state);
  const preferredCity = preferredSet?.has(`${normalize(demand.city)}|${demand.state.toUpperCase()}`) ?? false;
  const roleMatch = desiredRole && (title.includes(desiredRole) || description.includes(desiredRole));
  const remoteBonus = demand.modality === "remoto";

  return Math.min(98, 52 + (roleMatch ? 20 : 0) + (preferredCity ? 18 : 0) + (sameCity ? 14 : 0) + (!sameCity && sameState ? 8 : 0) + (remoteBonus ? 6 : 0));
}

function quickSearches(professional?: { desired_role?: string | null; city?: string | null; state?: string | null } | null, preferredCities?: PreferredCityRow[]) {
  const items = [
    professional?.desired_role ? { label: professional.desired_role, href: `/professional?q=${encodeURIComponent(professional.desired_role)}` } : null,
    professional?.city && professional?.state ? { label: `${professional.city}/${professional.state}`, href: `/professional?local=${encodeURIComponent(`${professional.city}/${professional.state}`)}` } : null,
    { label: "Remoto", href: "/professional?modalidade=remoto" },
    ...(preferredCities ?? []).slice(0, 3).map((item) => ({ label: `${item.city}/${item.state}`, href: `/professional?local=${encodeURIComponent(`${item.city}/${item.state}`)}` }))
  ].filter((item): item is { label: string; href: string } => Boolean(item));

  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalize(item.label);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default async function ProfessionalHomePage({ searchParams }: { searchParams: Promise<{ q?: string; local?: string; modalidade?: string }> }) {
  const params = await searchParams;
  const query = normalize(params.q);
  const local = normalize(params.local);
  const modality = params.modalidade && ["presencial", "hibrido", "remoto"].includes(params.modalidade) ? params.modalidade : "";
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const [{ data: professional }, { data: notifications }, { data: demands }] = await Promise.all([
    supabase.from("professionals").select("id,full_name,desired_role,summary,education_level,city,state,phone,status").eq("user_id", userData.user?.id).maybeSingle(),
    supabase.from("notifications").select("id,title,created_at,read_at").eq("user_id", userData.user?.id).order("created_at", { ascending: false }).limit(4),
    supabase.from("demands").select("id,title,description,city,state,modality,contract_type,openings,created_at,company:companies(trade_name,segment)").in("status", ["active", "screening"]).order("created_at", { ascending: false }).limit(80)
  ]);

  const [
    { data: processes },
    { data: preferredCities },
    { data: resume },
    experiencesCount,
    coursesCount,
    educationsCount,
    skillsCount
  ] = professional?.id
    ? await Promise.all([
        supabase.from("screening_processes").select("id,status,demand:demands(title)").eq("professional_id", professional.id).order("updated_at", { ascending: false }).limit(4),
        supabase.from("professional_preferred_cities").select("city,state").eq("professional_id", professional.id),
        supabase.from("resumes").select("id").eq("professional_id", professional.id).maybeSingle(),
        supabase.from("professional_experiences").select("id", { count: "exact", head: true }).eq("professional_id", professional.id),
        supabase.from("professional_courses").select("id", { count: "exact", head: true }).eq("professional_id", professional.id),
        supabase.from("professional_educations").select("id", { count: "exact", head: true }).eq("professional_id", professional.id),
        supabase.from("professional_skills").select("id", { count: "exact", head: true }).eq("professional_id", professional.id)
      ])
    : [{ data: [] }, { data: [] }, { data: null }, { count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }];

  const preferredSet = new Set(((preferredCities ?? []) as PreferredCityRow[]).map((item) => `${normalize(item.city)}|${item.state.toUpperCase()}`));
  const allDemands = ((demands ?? []) as unknown as DemandRow[])
    .filter((demand) => {
      const company = one(demand.company);
      const matchesQuery = containsText(demand.title, query) || containsText(demand.description, query) || containsText(company?.trade_name, query) || containsText(company?.segment, query);
      const matchesLocal = !local || normalize(`${demand.city}/${demand.state}`).includes(local) || normalize(demand.city).includes(local) || normalize(demand.state).includes(local);
      const matchesModality = !modality || demand.modality === modality;
      return matchesQuery && matchesLocal && matchesModality;
    })
    .sort((a, b) => demandScore(b, professional, preferredSet) - demandScore(a, professional, preferredSet));

  const activeCompanies = Array.from(
    new Map(
      allDemands
        .map((demand) => one(demand.company))
        .filter((company): company is CompanySummary => Boolean(company?.trade_name))
        .map((company) => [company.trade_name, company])
    ).values()
  ).slice(0, 8);

  const recommended = allDemands.slice(0, 4);
  const remaining = allDemands.slice(4);
  const checklist = [
    { label: "Dados pessoais", done: Boolean(professional?.full_name && professional?.phone && professional?.city && professional?.state), href: "/professional/profile" },
    { label: "Objetivo", done: Boolean(professional?.desired_role && professional?.summary), href: "/professional/resume#objetivo" },
    { label: "Documento", done: Boolean(resume?.id), href: "/professional/resume#documento" },
    { label: "Experiencias", done: Number(experiencesCount.count ?? 0) > 0, href: "/professional/resume#experiencias" },
    { label: "Formacao", done: Number(educationsCount.count ?? 0) > 0, href: "/professional/resume#formacao" },
    { label: "Cursos", done: Number(coursesCount.count ?? 0) > 0, href: "/professional/resume#cursos" },
    { label: "Habilidades", done: Number(skillsCount.count ?? 0) > 0, href: "/professional/resume#habilidades" },
    { label: "Cidades de interesse", done: (preferredCities ?? []).length > 0, href: "/professional/profile" }
  ];
  const completion = Math.round((checklist.filter((item) => item.done).length / checklist.length) * 100);
  const quickLinks = quickSearches(professional, (preferredCities ?? []) as PreferredCityRow[]);

  return (
    <AppShell eyebrow="Profissional" title="Minha Area">
      <div className="space-y-5">
        <section className="border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-blue-700">Oportunidades para seu perfil</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Encontre vagas das empresas cadastradas</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Busque por cargo, empresa, area ou cidade. As melhores correspondencias aparecem primeiro conforme seu perfil, cidades de interesse e curriculo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/professional/search-demands" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Buscar demandas</Link>
              <Link href="/professional/profile" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Editar perfil</Link>
              <Link href="/professional/resume" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Melhorar curriculo</Link>
            </div>
          </div>

          <form className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_220px_150px]" action="/professional">
            <label className="text-sm font-semibold text-slate-700">
              O que?
              <span className="mt-2 flex items-center gap-2 border border-slate-300 bg-slate-50 px-3 py-2.5 focus-within:border-blue-700 focus-within:bg-white">
                <Search aria-hidden="true" className="text-slate-400" size={17} />
                <input name="q" defaultValue={params.q ?? ""} placeholder="Cargo, habilidade ou empresa" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
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

          {quickLinks.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="py-2 font-semibold text-slate-500">Pesquisas rapidas:</span>
              {quickLinks.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700">Perfil profissional</p>
                <h2 className="mt-2 text-2xl font-semibold">{professional?.full_name ?? "Complete seu cadastro"}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {professional?.desired_role ?? "Cargo desejado nao informado"} · {professional?.city ?? "Cidade"}/{professional?.state ?? "UF"}
                </p>
              </div>
              <div className="min-w-[160px] rounded-md border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs font-bold uppercase text-blue-700">Forca do curriculo</p>
                <div className="mt-2 flex items-end gap-2">
                  <strong className="text-3xl leading-none text-slate-950">{completion}%</strong>
                  <span className="text-xs font-semibold text-slate-500">completo</span>
                </div>
                <div className="mt-3 h-2 bg-white">
                  <span className="block h-full bg-blue-700" style={{ width: `${completion}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {checklist.map((item) => (
                <Link key={item.label} href={item.href} className={`flex items-center gap-2 border px-3 py-2 text-sm font-semibold ${item.done ? "border-green-200 bg-green-50 text-green-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                  <CheckCircle2 aria-hidden="true" size={16} />
                  {item.label}
                </Link>
              ))}
            </div>
          </section>

          <aside className="border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="inline-flex items-center gap-2 text-base font-semibold"><Bell aria-hidden="true" size={17} /> Notificacoes</h2>
              <Link href="/professional/notifications" className="text-sm font-semibold text-blue-700">Ver todas</Link>
            </div>
            <div className="mt-4 space-y-3">
              {(notifications ?? []).length === 0 ? <p className="text-sm text-slate-500">Nenhuma notificacao por enquanto.</p> : null}
              {(notifications ?? []).map((notification) => (
                <div key={notification.id} className="border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="font-medium">{notification.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{notification.read_at ? "Lida" : `Nova · ${formatDate(notification.created_at)}`}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <section className="border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-700">Empresas visiveis para voce</p>
              <h2 className="mt-1 text-xl font-semibold">Empresas com vagas abertas</h2>
            </div>
            <Link href="/professional/search-demands" className="text-sm font-semibold text-blue-700">Buscar demandas</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {activeCompanies.map((company) => (
              <article key={company.trade_name} className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">{company.trade_name}</p>
                <p className="mt-1 text-sm text-slate-600">{company.segment ?? "Segmento em definicao"}</p>
              </article>
            ))}
            {activeCompanies.length === 0 ? <p className="text-sm text-slate-500">Nenhuma empresa com demanda ativa no momento.</p> : null}
          </div>
        </section>

        <section className="border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-700">Vagas que podem te interessar</p>
              <h2 className="mt-1 text-xl font-semibold">Recomendadas primeiro</h2>
            </div>
            <p className="rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">{allDemands.length} oportunidade(s)</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {recommended.map((demand) => {
              const company = one(demand.company);
              const isPreferred = preferredSet.has(`${normalize(demand.city)}|${demand.state.toUpperCase()}`);
              const score = demandScore(demand, professional, preferredSet);

              return (
                <article key={demand.id} className="border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">{demand.title}</h3>
                      <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-600">
                        <Building2 aria-hidden="true" size={14} />
                        {company?.trade_name ?? "Empresa cadastrada"}{company?.segment ? ` · ${company.segment}` : ""}
                      </p>
                    </div>
                    <span className="rounded-md bg-blue-700 px-2.5 py-1 text-xs font-bold text-white">{score}% aderente</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{demand.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1 bg-white px-2 py-1"><MapPin aria-hidden="true" size={13} /> {demand.city}/{demand.state}</span>
                    <span className="bg-white px-2 py-1">{modalityLabels[demand.modality] ?? demand.modality}</span>
                    <span className="bg-white px-2 py-1">{contractLabels[demand.contract_type] ?? demand.contract_type}</span>
                    <span className="bg-white px-2 py-1">{demand.openings} vaga(s)</span>
                    {isPreferred ? <span className="bg-blue-100 px-2 py-1 text-blue-800">Cidade de interesse</span> : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href="/professional/compatibility" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Ver compatibilidade</Link>
                    <Link href="/professional/resume" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Ajustar curriculo</Link>
                  </div>
                </article>
              );
            })}
            {recommended.length === 0 ? <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">Nenhuma vaga encontrada com esses filtros.</p> : null}
          </div>
        </section>

        {remaining.length > 0 ? (
          <section className="border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Target aria-hidden="true" size={18} className="text-blue-700" />
              <h2 className="text-base font-semibold">Outras oportunidades abertas</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {remaining.map((demand) => (
                <article key={demand.id} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-center">
                  <div>
                    <h3 className="font-semibold">{demand.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{one(demand.company)?.trade_name ?? "Empresa cadastrada"} · {demand.city}/{demand.state} · {modalityLabels[demand.modality] ?? demand.modality}</p>
                  </div>
                  <Link href="/professional/compatibility" className="inline-flex justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Analisar</Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold"><Clock3 aria-hidden="true" size={17} /> Processos em andamento</h2>
            <Link href="/professional/referrals" className="text-sm font-semibold text-blue-700">Ver encaminhamentos</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Oportunidade</th><th>Status</th><th>Proximo passo</th></tr></thead>
              <tbody>
                {((processes ?? []) as unknown as ProcessRow[]).map((process) => (
                  <tr key={process.id}>
                    <td>{one(process.demand)?.title ?? "Demanda em triagem"}</td>
                    <td>{process.status}</td>
                    <td><Link href="/professional/screening-status" className="font-semibold text-blue-700">Acompanhar</Link></td>
                  </tr>
                ))}
                {(processes ?? []).length === 0 ? <tr><td colSpan={3}>Nenhum processo encontrado.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <Link href="/professional/resume" className="border border-slate-200 bg-white p-4 shadow-sm">
            <FileText aria-hidden="true" className="text-blue-700" size={20} />
            <strong className="mt-3 block">Atualizar curriculo</strong>
            <span className="mt-1 block text-sm leading-6 text-slate-600">Mantenha dados, cursos e experiencias prontos para triagem.</span>
          </Link>
          <Link href="/professional/profile" className="border border-slate-200 bg-white p-4 shadow-sm">
            <MapPin aria-hidden="true" className="text-blue-700" size={20} />
            <strong className="mt-3 block">Cidades de interesse</strong>
            <span className="mt-1 block text-sm leading-6 text-slate-600">Defina onde quer receber oportunidades.</span>
          </Link>
          <Link href="/professional/development" className="border border-slate-200 bg-white p-4 shadow-sm">
            <Sparkles aria-hidden="true" className="text-blue-700" size={20} />
            <strong className="mt-3 block">Desenvolvimento</strong>
            <span className="mt-1 block text-sm leading-6 text-slate-600">Veja competencias que podem melhorar sua aderencia.</span>
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
