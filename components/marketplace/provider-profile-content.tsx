import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, ImageIcon, MapPin, MessageCircle, ShieldCheck, Star, Store } from "lucide-react";
import { startConversationAction } from "@/lib/actions/marketplace";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { getProviderCoverUrl } from "@/lib/marketplace/provider-media";

const conversationErrors: Record<string, string> = {
  marketplace_requester_required: "Use uma conta de Cliente ou Profissional para iniciar uma conversa.",
  provider_unavailable: "Este prestador não está disponível para novas conversas agora.",
  cannot_contact_own_provider_profile: "Você não pode iniciar uma conversa com o seu próprio perfil de prestador.",
  client_profile_required: "Complete seu perfil antes de iniciar uma conversa.",
  conversation_unavailable: "Não foi possível iniciar a conversa. Tente novamente."
};

export async function ProviderProfileContent({
  providerId,
  backHref,
  returnTo,
  error
}: {
  providerId: string;
  backHref: string;
  returnTo: string;
  error?: string;
}) {
  const supabase = await createServerClient();
  const admin = hasSupabaseAdminEnv() ? createAdminClient() : null;
  const { data } = await supabase.rpc("get_service_provider_public", { target_provider_id: providerId });
  const provider = data?.[0];
  if (!provider) notFound();

  const [{ data: reviews }, { data: portfolio }, coverUrl] = await Promise.all([
    supabase.from("service_reviews").select("id,rating,comment,provider_response,created_at").eq("provider_id", providerId).eq("moderation_status", "approved").order("created_at", { ascending: false }).limit(12),
    supabase.from("service_provider_portfolio").select("id,title,description,storage_path").eq("provider_id", providerId).eq("moderation_status", "approved").order("display_order"),
    getProviderCoverUrl(providerId)
  ]);
  const portfolioWithUrls = admin
    ? await Promise.all((portfolio ?? []).map(async (item) => ({
        ...item,
        url: (await admin.storage.from("provider-portfolios").createSignedUrl(item.storage_path, 3600)).data?.signedUrl
      })))
    : [];

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-bold text-[#0F2D4E] hover:text-[#F2811D]"><ArrowLeft size={17} />Voltar para prestadores</Link>
      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">{conversationErrors[decodeURIComponent(error)] ?? conversationErrors.conversation_unavailable}</p> : null}

      <section className="relative overflow-hidden rounded-[30px] border border-[#D7E1EA] bg-[#0F2D4E] shadow-[0_24px_70px_rgba(15,45,78,0.2)]">
        <div className="relative aspect-[16/6] min-h-56 overflow-hidden">
          {coverUrl ? (
            <img src={coverUrl} alt={`Capa dos serviços de ${provider.full_name}`} className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center bg-[radial-gradient(circle_at_75%_20%,#2C668F_0,#173F69_34%,#0F2D4E_75%)] text-white/80"><Store size={64} /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F2D4E] via-[#0F2D4E]/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-bold"><ShieldCheck size={15} />Prestador aprovado</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{provider.full_name}</h2>
            <p className="mt-1 text-base font-semibold text-[#FFD1A8]">{provider.professional_title}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/85">
              <span className="inline-flex items-center gap-1.5"><MapPin size={16} />{provider.city}, {provider.state}</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-[#FFD08F]"><Star size={16} fill="currentColor" />{Number(provider.rating_average).toFixed(1)} · {provider.rating_count} avaliações</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#0F2D4E]">Sobre o serviço</h2>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{provider.service_description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {provider.category_names?.map((item: string) => <span key={item} className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-[#0F2D4E]">{item}</span>)}
              {provider.specialties?.map((item: string) => <span key={item} className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-700">{item}</span>)}
            </div>
          </section>

          {provider.experience_description ? <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="flex items-center gap-2 text-xl font-bold text-[#0F2D4E]"><BriefcaseBusiness size={20} />Experiência</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">{provider.experience_description}</p></section> : null}

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[#0F2D4E]"><ImageIcon size={20} />Portfólio</h2>
            {portfolioWithUrls.length ? <div className="grid gap-4 sm:grid-cols-2">{portfolioWithUrls.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{item.url ? <img src={item.url} alt={item.title} className="aspect-video w-full object-cover" /> : null}<div className="p-4"><h3 className="font-bold text-[#0F2D4E]">{item.title}</h3><p className="mt-1 text-sm text-slate-600">{item.description}</p></div></article>)}</div> : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">Este prestador ainda não publicou imagens no portfólio.</p>}
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-[#0F2D4E]">Avaliações</h2>
            <div className="grid gap-3">{reviews?.length ? reviews.map((review) => <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="font-bold text-amber-600">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p><p className="mt-2 text-sm leading-6 text-slate-700">{review.comment || "Avaliação sem comentário."}</p>{review.provider_response ? <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm"><strong>Resposta:</strong> {review.provider_response}</p> : null}</article>) : <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">Este prestador ainda não recebeu avaliações.</p>}</div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <p className="text-sm text-slate-500">Modalidade</p>
          <p className="font-bold text-[#0F2D4E]">{provider.service_mode === "both" ? "Presencial e remoto" : provider.service_mode === "remote" ? "Remoto" : "Presencial"}</p>
          <p className="mt-4 text-sm text-slate-500">Preço</p>
          <p className="text-xl font-bold text-[#0F2D4E]">{provider.starting_price ? `A partir de R$ ${Number(provider.starting_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Sob orçamento"}</p>
          <form action={startConversationAction} className="mt-6">
            <input type="hidden" name="providerId" value={providerId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F2811D] px-5 py-3.5 font-bold text-white hover:bg-[#DD7010]"><MessageCircle size={19} />Iniciar conversa</button>
          </form>
          <p className="mt-3 text-center text-xs leading-5 text-slate-500">Contato protegido dentro do Portal Encaixe.</p>
        </aside>
      </div>
    </div>
  );
}
