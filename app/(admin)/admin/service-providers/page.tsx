import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, ShieldAlert, XCircle } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { moderatePortfolioAction, moderateProviderAction } from "@/lib/actions/marketplace";
import { isMarketplaceEnabled } from "@/lib/features";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const input = "rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#F2811D]";
const statusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Reprovado",
  suspended: "Suspenso"
};
const successMessages: Record<string, string> = {
  approved: "Prestador aprovado e liberado na busca de serviços.",
  rejected: "Prestador reprovado. O motivo foi enviado ao profissional.",
  suspended: "Prestador suspenso e removido da busca de serviços.",
  pending: "Prestador devolvido para análise."
};
const errorMessages: Record<string, string> = {
  "solicitacao-invalida": "Não foi possível identificar o prestador ou a ação solicitada.",
  "motivo-obrigatorio": "Informe o motivo antes de reprovar ou suspender o prestador.",
  "aprovacao-nao-confirmada": "O banco não confirmou a alteração. Atualize a página e tente novamente.",
  "admin_required": "Sua sessão não possui permissão administrativa para esta ação.",
  "provider_not_found": "O cadastro do prestador não foi encontrado.",
  "moderation_reason_required": "Informe o motivo antes de reprovar ou suspender o prestador."
};

type ProfessionalSummary = {
  full_name?: string;
  email?: string;
};

export default async function AdminServiceProvidersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerClient();

  if (!(await isMarketplaceEnabled())) {
    redirect("/admin/settings?message=marketplace-desativado");
  }

  let query = supabase
    .from("service_provider_profiles")
    .select("*,professionals(full_name,email,user_id)")
    .order("submitted_at", { ascending: false });
  if (params.status) query = query.eq("status", params.status);

  const { data, error: queryError } = await query;
  const search = params.q?.trim().toLowerCase();
  const filtered = data?.filter((provider) => {
    const professional = provider.professionals as ProfessionalSummary;
    return !search || `${professional?.full_name} ${professional?.email} ${provider.professional_title}`.toLowerCase().includes(search);
  });
  const providerIds = filtered?.map((provider) => provider.id) ?? [];
  const { data: portfolio } = providerIds.length
    ? await supabase
        .from("service_provider_portfolio")
        .select("id,provider_id,title,moderation_status")
        .in("provider_id", providerIds)
        .eq("moderation_status", "pending")
    : { data: [] };

  const rawError = params.error ? decodeURIComponent(params.error) : queryError?.message;
  const friendlyError = rawError ? errorMessages[rawError] ?? rawError : null;
  const successMessage = params.success ? successMessages[params.success] : null;

  return (
    <AppShell eyebrow="Administrador" title="Aprovação de prestadores">
      {friendlyError ? (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {friendlyError}
        </p>
      ) : null}
      {successMessage ? (
        <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
          {successMessage}
        </p>
      ) : null}

      <form className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_220px_auto]">
        <input className={input} name="q" defaultValue={params.q} placeholder="Nome, e-mail ou serviço" />
        <select className={input} name="status" defaultValue={params.status ?? ""}>
          <option value="">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovados</option>
          <option value="rejected">Reprovados</option>
          <option value="suspended">Suspensos</option>
        </select>
        <button type="submit" className="rounded-xl bg-[#0F2D4E] px-5 py-2.5 font-bold text-white">
          Filtrar
        </button>
      </form>

      <div className="grid gap-4">
        {filtered?.length ? (
          filtered.map((provider) => {
            const professional = provider.professionals as ProfessionalSummary;
            const pendingImages = portfolio?.filter((item) => item.provider_id === provider.id) ?? [];
            const isSuspended = provider.status === "suspended";
            const isApproved = provider.status === "approved";
            const isRejected = provider.status === "rejected";

            return (
              <article key={provider.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase text-[#F2811D]">{statusLabels[provider.status] ?? provider.status}</span>
                    <h2 className="text-xl font-bold text-[#0F2D4E]">{professional?.full_name}</h2>
                    <p className="text-sm text-slate-500">
                      {professional?.email} · {provider.professional_title}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
                    Nota {Number(provider.rating_average).toFixed(1)}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{provider.service_description}</p>
                <p className="mt-3 text-xs text-slate-500">
                  Especialidades: {provider.specialties?.join(", ") || "Não informadas"}
                </p>

                <form action={moderateProviderAction} className="mt-4 grid gap-2 sm:grid-cols-[minmax(220px,1fr)_repeat(3,auto)]">
                  <input type="hidden" name="providerId" value={provider.id} />
                  <input
                    className={input}
                    name="reason"
                    placeholder="Motivo obrigatório para reprovar ou suspender"
                    aria-label="Motivo da moderação"
                  />
                  {!isApproved && !isSuspended ? (
                    <button
                      type="submit"
                      name="status"
                      value="approved"
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white"
                    >
                      <CheckCircle2 aria-hidden="true" size={15} />
                      Aprovar
                    </button>
                  ) : null}
                  {!isRejected ? (
                    <button
                      type="submit"
                      name="status"
                      value="rejected"
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white"
                    >
                      <XCircle aria-hidden="true" size={15} />
                      Reprovar
                    </button>
                  ) : null}
                  {isSuspended ? (
                    <button
                      type="submit"
                      name="status"
                      value="approved"
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white"
                    >
                      <Clock3 aria-hidden="true" size={15} />
                      Reativar
                    </button>
                  ) : (
                    <button
                      type="submit"
                      name="status"
                      value="suspended"
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#0F2D4E] px-4 py-2 text-xs font-bold text-white"
                    >
                      <ShieldAlert aria-hidden="true" size={15} />
                      Suspender
                    </button>
                  )}
                </form>

                {pendingImages.length > 0 ? (
                  <div className="mt-4 rounded-xl bg-amber-50 p-4">
                    <p className="text-xs font-bold text-amber-800">Portfólio aguardando moderação</p>
                    {pendingImages.map((item) => (
                      <form key={item.id} action={moderatePortfolioAction} className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <input type="hidden" name="portfolioId" value={item.id} />
                        <span>{item.title}</span>
                        <span className="flex gap-2">
                          <button type="submit" name="status" value="approved" className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white">
                            Aprovar
                          </button>
                          <button type="submit" name="status" value="removed" className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white">
                            Remover
                          </button>
                        </span>
                      </form>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })
        ) : (
          <p className="rounded-2xl bg-white p-8 text-center text-slate-500">Nenhum prestador encontrado.</p>
        )}
      </div>
    </AppShell>
  );
}
