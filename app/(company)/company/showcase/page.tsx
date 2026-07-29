import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, BookOpenCheck, BriefcaseBusiness, Languages, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { ProfessionalLikeButton } from "@/components/company/professional-like-button";
import { requireRole } from "@/lib/auth/access";
import { hasProAccess } from "@/lib/companies/plans";
import { createServerClient } from "@/lib/supabase/server";

type ShowcaseProfessional = {
  professional_id: string;
  full_name: string;
  desired_role: string;
  summary: string | null;
  experience_months: number;
  recent_role: string | null;
  languages: Array<{ name: string; proficiency: string }>;
  certifications: Array<{ title: string; category: string; approved_at: string }>;
  specializations: string[];
  compatibility_score: number | null;
  liked: boolean;
  like_id: string | null;
  like_status: "pendente" | "processado" | null;
  total_count: number;
};

type LikeHistory = {
  like_id: string;
  professional_id: string;
  professional_name: string;
  desired_role: string;
  demanda_id: string;
  demand_title: string;
  status: "pendente" | "processado";
  criado_em: string;
  processado_em: string | null;
};

const PAGE_SIZE = 12;

function pageHref(params: Record<string, string | undefined>, page: number) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  query.set("page", String(page));
  return `/company/showcase?${query.toString()}`;
}

export default async function CompanyShowcasePage({
  searchParams
}: {
  searchParams: Promise<{
    q?: string;
    area?: string;
    language?: string;
    certification?: string;
    experience?: string;
    demand?: string;
    page?: string;
  }>;
}) {
  await requireRole("company");
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: company } = await supabase
    .from("companies")
    .select("id,plano,status,deleted_at")
    .eq("owner_id", userData.user?.id)
    .maybeSingle();

  if (!company || !hasProAccess(company.plano) || company.status !== "approved" || company.deleted_at) {
    redirect("/company?error=vitrine-exclusiva-plano-pro");
  }

  const { data: demands } = await supabase
    .from("demands")
    .select("id,name,title,status")
    .eq("company_id", company.id)
    .in("status", ["active", "screening"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const selectedDemand = (demands ?? []).find((demand) => demand.id === params.demand)?.id ?? null;
  const currentPage = Math.max(Number.parseInt(params.page ?? "1", 10) || 1, 1);
  const minimumExperience = params.experience ? Number.parseInt(params.experience, 10) : null;

  const [{ data: professionals, error: showcaseError }, { data: history }] = await Promise.all([
    supabase.rpc("list_pro_professionals", {
      search_query: params.q?.trim() || null,
      area_filter: params.area?.trim() || null,
      language_filter: params.language?.trim() || null,
      certification_filter: params.certification?.trim() || null,
      min_experience_months: Number.isFinite(minimumExperience) ? minimumExperience : null,
      target_demand_id: selectedDemand,
      page_offset: (currentPage - 1) * PAGE_SIZE,
      page_limit: PAGE_SIZE
    }),
    supabase.rpc("get_company_professional_likes")
  ]);

  const rows = (professionals ?? []) as ShowcaseProfessional[];
  const likes = (history ?? []) as LikeHistory[];
  const total = Number(rows[0]?.total_count ?? 0);
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const selectedDemandName = (demands ?? []).find((demand) => demand.id === selectedDemand);
  const preservedParams = {
    q: params.q,
    area: params.area,
    language: params.language,
    certification: params.certification,
    experience: params.experience,
    demand: selectedDemand ?? undefined
  };

  return (
    <AppShell eyebrow="Empresa" title="Vitrine de profissionais">
      <div className="space-y-6">
        <section className="showcase-command-panel">
          <div className="showcase-command-copy">
            <span className="showcase-pro-mark"><Sparkles aria-hidden="true" size={15} /> Canal Pro</span>
            <h2>Talentos para demandas reais, sem exposição de dados pessoais</h2>
            <p>
              Explore currículos ativos com informações profissionais resumidas. O contato completo só é liberado depois que a apresentação for formalizada.
            </p>
          </div>
          <div className="showcase-command-stat">
            <strong>{total}</strong>
            <span>profissionais elegíveis</span>
          </div>
        </section>

        <section className="showcase-filter-band" aria-label="Filtros da vitrine">
          <form action="/company/showcase" className="grid gap-3 lg:grid-cols-4">
            <label className="lg:col-span-2">
              <span>Demanda aberta</span>
              <select name="demand" defaultValue={selectedDemand ?? ""} className="field-input">
                <option value="">Selecione para comparar e curtir</option>
                {(demands ?? []).map((demand) => (
                  <option key={demand.id} value={demand.id}>{demand.name ?? demand.title}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Busca</span>
              <input name="q" defaultValue={params.q ?? ""} className="field-input" placeholder="Nome, cargo ou resumo" />
            </label>
            <label>
              <span>Área de atuação</span>
              <input name="area" defaultValue={params.area ?? ""} className="field-input" placeholder="Ex.: logística" />
            </label>
            <label>
              <span>Idioma</span>
              <input name="language" defaultValue={params.language ?? ""} className="field-input" placeholder="Ex.: inglês" />
            </label>
            <label>
              <span>Curso ou certificação</span>
              <input name="certification" defaultValue={params.certification ?? ""} className="field-input" placeholder="Ex.: atendimento" />
            </label>
            <label>
              <span>Experiência mínima</span>
              <select name="experience" defaultValue={params.experience ?? ""} className="field-input">
                <option value="">Qualquer experiência</option>
                <option value="12">1 ano ou mais</option>
                <option value="24">2 anos ou mais</option>
                <option value="60">5 anos ou mais</option>
                <option value="120">10 anos ou mais</option>
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button className="brand-action-button min-h-11 flex-1" type="submit">Aplicar filtros</button>
              <Link href="/company/showcase" className="brand-quiet-button min-h-11">Limpar</Link>
            </div>
          </form>
        </section>

        {showcaseError ? (
          <section className="showcase-empty-state" role="alert">
            <h2>Não foi possível abrir a vitrine</h2>
            <p>{showcaseError.message}</p>
          </section>
        ) : rows.length > 0 ? (
          <section className="talent-showcase-grid" aria-label="Profissionais encontrados">
            {rows.map((professional) => {
              const years = Math.floor(professional.experience_months / 12);
              const months = professional.experience_months % 12;
              return (
                <article key={professional.professional_id} className="talent-showcase-card">
                  <div className="talent-card-topline">
                    <div>
                      <p className="talent-card-kicker">Currículo ativo</p>
                      <h2>{professional.full_name}</h2>
                      <p>{professional.desired_role}</p>
                    </div>
                    {professional.compatibility_score !== null ? (
                      <div className="talent-score" aria-label={`${Number(professional.compatibility_score).toFixed(0)} por cento de compatibilidade`}>
                        <strong>{Number(professional.compatibility_score).toFixed(0)}%</strong>
                        <span>compatível</span>
                      </div>
                    ) : null}
                  </div>

                  <p className="talent-card-summary">
                    {professional.summary ?? "O profissional ainda não adicionou um resumo público ao currículo."}
                  </p>

                  <div className="talent-card-facts">
                    <div><BriefcaseBusiness aria-hidden="true" size={17} /><span><strong>{years > 0 ? `${years} ano${years > 1 ? "s" : ""}` : `${months} meses`}</strong>{professional.recent_role ?? "Experiência registrada"}</span></div>
                    <div><Languages aria-hidden="true" size={17} /><span><strong>{professional.languages.length} idioma(s)</strong>{professional.languages.slice(0, 2).map((item) => `${item.name} (${item.proficiency})`).join(", ") || "Não informado"}</span></div>
                    <div><BookOpenCheck aria-hidden="true" size={17} /><span><strong>{professional.certifications.length} curso(s)</strong>{professional.certifications.slice(0, 2).map((item) => item.title).join(", ") || "Sem certificação na plataforma"}</span></div>
                  </div>

                  <div className="talent-specializations">
                    {professional.specializations.slice(0, 5).map((specialization) => (
                      <span key={specialization}><Award aria-hidden="true" size={12} />{specialization}</span>
                    ))}
                  </div>

                  <div className="talent-card-footer">
                    <p>{selectedDemandName ? `Interesse para ${selectedDemandName.name ?? selectedDemandName.title}` : "Selecione uma demanda para registrar interesse."}</p>
                    <ProfessionalLikeButton
                      professionalId={professional.professional_id}
                      demandId={selectedDemand}
                      initialLikeId={professional.like_id}
                      initialStatus={professional.like_status}
                    />
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="showcase-empty-state">
            <h2>Nenhum currículo ativo corresponde aos filtros</h2>
            <p>Ajuste os critérios ou limpe os filtros para ampliar a busca.</p>
          </section>
        )}

        {totalPages > 1 ? (
          <nav className="showcase-pagination" aria-label="Paginação da vitrine">
            <Link aria-disabled={currentPage <= 1} href={pageHref(preservedParams, Math.max(currentPage - 1, 1))}>Anterior</Link>
            <span>Página {currentPage} de {totalPages}</span>
            <Link aria-disabled={currentPage >= totalPages} href={pageHref(preservedParams, Math.min(currentPage + 1, totalPages))}>Próxima</Link>
          </nav>
        ) : null}

        <section className="showcase-history">
          <div className="showcase-section-heading">
            <div>
              <p>Seus interesses</p>
              <h2>Histórico de profissionais curtidos</h2>
            </div>
            <span>{likes.length} registro(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Profissional</th><th>Demanda</th><th>Enviado em</th><th>Status</th></tr></thead>
              <tbody>
                {likes.map((like) => (
                  <tr key={like.like_id}>
                    <td><strong>{like.professional_name}</strong><p className="text-xs text-slate-500">{like.desired_role}</p></td>
                    <td>{like.demand_title}</td>
                    <td>{new Date(like.criado_em).toLocaleDateString("pt-BR")}</td>
                    <td><span className={`origin-badge ${like.status === "processado" ? "is-interest" : "is-pending"}`}>{like.status === "processado" ? "Apresentação formalizada" : "Pendente de formalização"}</span></td>
                  </tr>
                ))}
                {likes.length === 0 ? <tr><td colSpan={4}>Você ainda não demonstrou interesse em nenhum profissional.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
