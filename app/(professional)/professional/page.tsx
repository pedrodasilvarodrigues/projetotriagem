import { Search, SlidersHorizontal, Store } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { ProviderCard, type ProviderSummary } from "@/components/marketplace/provider-card";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfessionalHomePage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; city?: string; mode?: string; rating?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const [{ data: providers }, { data: categories }] = await Promise.all([
    supabase.rpc("search_service_providers", {
      search_text: params.q || null,
      target_category: params.category || null,
      target_city: params.city || null,
      target_mode: params.mode || null,
      minimum_rating: params.rating ? Number(params.rating) : null,
      result_limit: 48,
      result_offset: 0
    }),
    supabase.from("service_categories").select("id,name,parent_id").eq("is_active", true).order("display_order").order("name")
  ]);
  const roots = categories?.filter((category) => !category.parent_id) ?? [];
  const children = categories?.filter((category) => category.parent_id) ?? [];

  return <AppShell eyebrow="Profissional" title="Minha Área">
    <section className="mb-6 overflow-hidden rounded-2xl bg-[#0F2D4E] p-6 text-white shadow-lg sm:p-8">
      <div className="max-w-3xl"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-orange-300"><Store size={17} />Serviços no Portal Encaixe</p><h2 className="mt-3 text-2xl font-bold sm:text-3xl">Encontre prestadores aprovados para o que você precisa</h2><p className="mt-3 text-sm leading-6 text-blue-100">Todo profissional pode pesquisar e contratar serviços. Seu currículo, vagas e processos continuam disponíveis nas abas próprias do menu.</p></div>
    </section>
    <form className="mb-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_160px_auto]">
      <label className="relative"><span className="sr-only">Nome ou serviço</span><Search className="absolute left-3 top-3.5 text-slate-400" size={18} /><input name="q" defaultValue={params.q} className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm outline-none focus:border-[#F2811D]" placeholder="Nome, serviço ou especialidade" /></label>
      <select name="category" defaultValue={params.category ?? ""} className="rounded-xl border border-slate-300 px-3 py-3 text-sm"><option value="">Categoria e subcategoria</option>{roots.map((root) => <optgroup key={root.id} label={root.name}><option value={root.id}>{root.name}</option>{children.filter((child) => child.parent_id === root.id).map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}</optgroup>)}</select>
      <input name="city" defaultValue={params.city} className="rounded-xl border border-slate-300 px-3 py-3 text-sm" placeholder="Cidade" />
      <select name="mode" defaultValue={params.mode ?? ""} className="rounded-xl border border-slate-300 px-3 py-3 text-sm"><option value="">Qualquer modalidade</option><option value="in_person">Presencial</option><option value="remote">Remoto</option><option value="both">Ambos</option></select>
      <select name="rating" defaultValue={params.rating ?? ""} className="rounded-xl border border-slate-300 px-3 py-3 text-sm"><option value="">Qualquer nota</option><option value="4">4 estrelas ou mais</option><option value="3">3 estrelas ou mais</option></select>
      <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F2811D] px-5 py-3 font-bold text-white hover:bg-[#dd7010]"><SlidersHorizontal size={17} />Filtrar</button>
    </form>
    {providers?.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{(providers as ProviderSummary[]).map((provider) => <ProviderCard key={provider.provider_id} provider={provider} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><h2 className="text-xl font-bold text-[#0F2D4E]">Nenhum prestador encontrado</h2><p className="mt-2 text-slate-600">Tente ampliar a localização ou remover algum filtro.</p></div>}
  </AppShell>;
}
