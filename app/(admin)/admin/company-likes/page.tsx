import { CheckCircle2, HeartHandshake } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { formalizeCompanyLikeAction } from "@/lib/actions/workspace";
import { requireRole } from "@/lib/auth/access";
import { createServerClient } from "@/lib/supabase/server";

type LikeRow = {
  id: string;
  status: "pendente" | "processado";
  criado_em: string;
  processado_em: string | null;
  company: { trade_name: string; plano: string } | Array<{ trade_name: string; plano: string }> | null;
  professional: { full_name: string; desired_role: string } | Array<{ full_name: string; desired_role: string }> | null;
  demand: { name: string | null; title: string } | Array<{ name: string | null; title: string }> | null;
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCompanyLikesPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; message?: string; error?: string }>;
}) {
  await requireRole("admin");
  const params = await searchParams;
  const status = params.status === "processado" ? "processado" : "pendente";
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("company_professional_likes")
    .select("id,status,criado_em,processado_em,company:companies!empresa_id(trade_name,plano),professional:professionals!professional_id(full_name,desired_role),demand:demands!demanda_id(name,title)")
    .eq("status", status)
    .order("criado_em", { ascending: status === "pendente" })
    .limit(200);
  const likes = (data ?? []) as unknown as LikeRow[];

  return (
    <AppShell eyebrow="Administrador" title="Interesses de empresas Pro">
      <div className="space-y-5">
        {params.error ? <div className="showcase-alert is-error" role="alert"><strong>Não foi possível formalizar</strong><span>{params.error}</span></div> : null}
        {params.message ? <div className="showcase-alert is-success" role="status"><CheckCircle2 aria-hidden="true" size={18} /><span>Apresentação formalizada e vinculada ao processo seletivo.</span></div> : null}

        <section className="admin-interest-intro">
          <div>
            <span><HeartHandshake aria-hidden="true" size={16} /> Canal iniciado pela empresa</span>
            <h2>Formalização sem etapa de veto</h2>
            <p>
              A empresa já decidiu avançar. Aqui o papel administrativo é liberar o contato e criar a apresentação no processo da demanda.
            </p>
          </div>
          <nav aria-label="Situação das curtidas">
            <a href="/admin/company-likes" aria-current={status === "pendente" ? "page" : undefined}>Pendentes</a>
            <a href="/admin/company-likes?status=processado" aria-current={status === "processado" ? "page" : undefined}>Processadas</a>
          </nav>
        </section>

        <section className="admin-interest-list" aria-label={status === "pendente" ? "Curtidas pendentes" : "Curtidas processadas"}>
          {likes.map((like) => {
            const company = one(like.company);
            const professional = one(like.professional);
            const demand = one(like.demand);
            return (
              <article key={like.id} className="admin-interest-row">
                <div className="admin-interest-company">
                  <span>Empresa {company?.plano?.toUpperCase()}</span>
                  <strong>{company?.trade_name}</strong>
                  <small>{new Date(like.criado_em).toLocaleString("pt-BR")}</small>
                </div>
                <div>
                  <span className="origin-badge is-interest">Você demonstrou interesse</span>
                  <h2>{professional?.full_name}</h2>
                  <p>{professional?.desired_role}</p>
                </div>
                <div>
                  <span>Demanda vinculada</span>
                  <strong>{demand?.name ?? demand?.title}</strong>
                </div>
                <div>
                  {like.status === "pendente" ? (
                    <form action={formalizeCompanyLikeAction}>
                      <input type="hidden" name="likeId" value={like.id} />
                      <button className="brand-action-button" type="submit">Formalizar apresentação</button>
                    </form>
                  ) : (
                    <span className="origin-badge is-processed"><CheckCircle2 aria-hidden="true" size={14} /> Formalizada em {like.processado_em ? new Date(like.processado_em).toLocaleDateString("pt-BR") : "-"}</span>
                  )}
                </div>
              </article>
            );
          })}
          {likes.length === 0 ? (
            <div className="showcase-empty-state">
              <h2>{status === "pendente" ? "Fila Pro em dia" : "Nenhuma apresentação formalizada"}</h2>
              <p>{status === "pendente" ? "Não há interesses aguardando formalização." : "As curtidas processadas aparecerão aqui."}</p>
            </div>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
