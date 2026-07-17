import { notFound } from "next/navigation";
import { BriefcaseBusiness, MapPin, MessageCircle, ShieldCheck, Star } from "lucide-react";
import { PublicPageShell } from "@/components/app/public-page-shell";
import { startConversationAction } from "@/lib/actions/marketplace";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { createServerClient, hasSupabasePublicEnv } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProviderPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabasePublicEnv()) notFound();
  const supabase = await createServerClient();
  const admin = hasSupabaseAdminEnv() ? createAdminClient() : null;
  const { data } = await supabase.rpc("get_service_provider_public", { target_provider_id: id });
  const provider = data?.[0];
  if (!provider) notFound();
  const [{ data: reviews }, { data: portfolio }] = await Promise.all([
    supabase.from("service_reviews").select("id,rating,comment,provider_response,created_at").eq("provider_id", id).eq("moderation_status", "approved").order("created_at", { ascending: false }).limit(12),
    supabase.from("service_provider_portfolio").select("id,title,description,storage_path").eq("provider_id", id).eq("moderation_status", "approved").order("display_order")
  ]);
  const portfolioWithUrls = admin ? await Promise.all((portfolio ?? []).map(async (item) => ({ ...item, url: (await admin.storage.from("provider-portfolios").createSignedUrl(item.storage_path, 3600)).data?.signedUrl }))) : [];
  return <PublicPageShell title={provider.full_name} eyebrow="Perfil do prestador" description={provider.professional_title}>
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"><ShieldCheck size={15} />Prestador aprovado</span><h2 className="mt-4 text-2xl font-bold text-[#0F2D4E]">{provider.professional_title}</h2><p className="mt-2 flex items-center gap-1 text-sm text-slate-500"><MapPin size={16} />{provider.city}, {provider.state}</p></div><div className="rounded-xl bg-amber-50 p-3 text-center text-amber-800"><span className="flex items-center gap-1 text-xl font-bold"><Star size={19} fill="currentColor" />{Number(provider.rating_average).toFixed(1)}</span><small>{provider.rating_count} avaliações</small></div></div><p className="mt-6 whitespace-pre-wrap leading-7 text-slate-700">{provider.service_description}</p><div className="mt-5 flex flex-wrap gap-2">{provider.category_names?.map((item: string) => <span key={item} className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-[#0F2D4E]">{item}</span>)}{provider.specialties?.map((item: string) => <span key={item} className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-700">{item}</span>)}</div></section>
        {provider.experience_description && <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="flex items-center gap-2 text-xl font-bold text-[#0F2D4E]"><BriefcaseBusiness size={20} />Experiência</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">{provider.experience_description}</p></section>}
        {portfolioWithUrls.length > 0 && <section><h2 className="mb-4 text-xl font-bold text-[#0F2D4E]">Portfólio</h2><div className="grid gap-4 sm:grid-cols-2">{portfolioWithUrls.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{item.url && <img src={item.url} alt={item.title} className="aspect-video w-full object-cover" />}<div className="p-4"><h3 className="font-bold text-[#0F2D4E]">{item.title}</h3><p className="mt-1 text-sm text-slate-600">{item.description}</p></div></article>)}</div></section>}
        <section><h2 className="mb-4 text-xl font-bold text-[#0F2D4E]">Avaliações verificadas</h2><div className="grid gap-3">{reviews?.length ? reviews.map((review) => <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="font-bold text-amber-600">{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</p><p className="mt-2 text-sm leading-6 text-slate-700">{review.comment || "Avaliação sem comentário."}</p>{review.provider_response && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm"><strong>Resposta:</strong> {review.provider_response}</p>}</article>) : <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">Este prestador ainda não recebeu avaliações.</p>}</div></section>
      </div>
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24"><p className="text-sm text-slate-500">Modalidade</p><p className="font-bold text-[#0F2D4E]">{provider.service_mode === "both" ? "Presencial e remoto" : provider.service_mode === "remote" ? "Remoto" : "Presencial"}</p><p className="mt-4 text-sm text-slate-500">Preço</p><p className="text-xl font-bold text-[#0F2D4E]">{provider.starting_price ? `A partir de R$ ${Number(provider.starting_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Sob orçamento"}</p><form action={startConversationAction} className="mt-6"><input type="hidden" name="providerId" value={id} /><button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F2811D] px-5 py-3.5 font-bold text-white hover:bg-[#dd7010]"><MessageCircle size={19} />Conversar e solicitar serviço</button></form><p className="mt-3 text-center text-xs leading-5 text-slate-500">Entre como cliente ou profissional. O telefone e o e-mail não são expostos.</p></aside>
    </div>
  </PublicPageShell>;
}
