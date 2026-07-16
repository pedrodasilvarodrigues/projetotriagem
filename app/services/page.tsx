import { Search, SlidersHorizontal } from "lucide-react";
import { PublicPageShell } from "@/components/app/public-page-shell";
import { ProviderCard, type ProviderSummary } from "@/components/marketplace/provider-card";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { createServerClient, hasSupabasePublicEnv } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ServicesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  let providers: ProviderSummary[] = [];
  let categories: Array<{ id: string; name: string; parent_id: string | null }> = [];
  if (hasSupabasePublicEnv()) {
    const supabase = await createServerClient();
    const catalogClient = hasSupabaseAdminEnv() ? createAdminClient() : supabase;
    const [providerResult, categoryResult] = await Promise.all([
      supabase.rpc("search_service_providers", { search_text: params.q || null, target_category: params.category || null, target_city: params.city || null, target_mode: params.mode || null, minimum_rating: params.rating ? Number(params.rating) : null, result_limit: 36, result_offset: 0 }),
      catalogClient.from("service_categories").select("id,name,parent_id").eq("is_active", true).order("display_order").order("name")
    ]);
    providers = (providerResult.data ?? []) as ProviderSummary[];
    categories = categoryResult.data ?? [];
  }
  return <PublicPageShell title="Encontre quem resolve" eyebrow="Marketplace de serviços" description="Prestadores aprovados, contato protegido e negociação direta dentro do Portal Encaixe.">
    <form className="mb-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[2fr_1fr_1fr_auto]">
      <label className="relative"><span className="sr-only">Pesquisar</span><Search className="absolute left-3 top-3.5 text-slate-400" size={18} /><input name="q" defaultValue={params.q} className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm outline-none focus:border-[#F2811D]" placeholder="Nome, serviço ou especialidade" /></label>
      <select name="category" defaultValue={params.category ?? ""} className="rounded-xl border border-slate-300 px-3 py-3 text-sm"><option value="">Todas as categorias</option>{categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
      <input name="city" defaultValue={params.city} className="rounded-xl border border-slate-300 px-3 py-3 text-sm" placeholder="Cidade" />
      <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F2811D] px-5 py-3 font-bold text-white"><SlidersHorizontal size={17} />Filtrar</button>
    </form>
    {providers.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{providers.map((provider) => <ProviderCard key={provider.provider_id} provider={provider} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><h2 className="text-xl font-bold text-[#0F2D4E]">Nenhum prestador encontrado</h2><p className="mt-2 text-slate-600">Ajuste os filtros ou tente outra palavra-chave.</p></div>}
  </PublicPageShell>;
}
