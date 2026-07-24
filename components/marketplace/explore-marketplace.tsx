import { Suspense } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Sparkles, Store, X } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import { createServicePostSignedUrlMap, isUuid, normalizeFeaturedProviders } from "@/lib/marketplace/explore";
import { ProviderPostCarousel } from "@/components/marketplace/provider-post-carousel";

export type ExploreSearchParams = {
  q?: string;
  category?: string;
  city?: string;
};

export function ExploreMarketplace({
  params,
  basePath
}: {
  params: ExploreSearchParams;
  basePath: "/professional" | "/client";
}) {
  const suspenseKey = `${params.q ?? ""}:${params.category ?? ""}:${params.city ?? ""}`;
  return (
    <Suspense key={suspenseKey} fallback={<ExploreCarouselSkeleton />}>
      <ExploreContent params={params} basePath={basePath} />
    </Suspense>
  );
}

async function ExploreContent({
  params,
  basePath
}: {
  params: ExploreSearchParams;
  basePath: "/professional" | "/client";
}) {
  const supabase = await createServerClient();
  const categoryId = isUuid(params.category) ? params.category : null;
  const [{ data: featuredRows, error }, { data: categories }] = await Promise.all([
    supabase.rpc("get_featured_service_providers", {
      search_text: params.q?.trim() || null,
      target_category: categoryId,
      target_city: params.city?.trim() || null
    }),
    supabase
      .from("service_categories")
      .select("id,name,parent_id")
      .eq("is_active", true)
      .order("display_order")
      .order("name")
  ]);

  const providerRows = normalizeFeaturedProviders(featuredRows as unknown[] | null);
  const imagePaths = providerRows.flatMap((provider) => provider.posts.flatMap((post) => post.images));
  const signedUrls = await createServicePostSignedUrlMap(supabase, imagePaths);
  const providers = providerRows
    .map((provider) => ({
      ...provider,
      posts: provider.posts
        .map((post) => ({
          ...post,
          images: post.images.map((path) => signedUrls.get(path)).filter((url): url is string => Boolean(url))
        }))
        .filter((post) => post.images.length > 0)
    }))
    .filter((provider) => provider.posts.length > 0);
  const roots = categories?.filter((category) => !category.parent_id) ?? [];
  const children = categories?.filter((category) => category.parent_id) ?? [];
  const hasFilters = Boolean(params.q || params.category || params.city);

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[30px] bg-[#0F2D4E] px-5 py-7 text-white shadow-[0_24px_70px_rgba(15,45,78,0.2)] sm:px-8 sm:py-9">
        <div aria-hidden="true" className="absolute -right-16 -top-20 size-64 rounded-full border-[42px] border-[#F2811D]/15" />
        <div aria-hidden="true" className="absolute bottom-0 right-20 h-px w-56 bg-gradient-to-r from-transparent via-[#F2811D] to-transparent" />
        <div className="relative max-w-3xl">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#FFB36E]">
            <Sparkles size={15} />Seleção por reputação real
          </p>
          <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">Descubra trabalhos. Encontre quem faz bem.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#DCE8F2]">
            Uma vitrine atualizada dos prestadores mais bem avaliados, organizada pelo trabalho que cada um publica.
          </p>
        </div>
      </section>

      <form className="rounded-[24px] border border-[#D8E2EB] bg-[#F9FBFC] p-3 shadow-[0_12px_35px_rgba(15,45,78,0.07)]">
        <div className="grid gap-2.5 md:grid-cols-[minmax(220px,1.4fr)_minmax(180px,1fr)_minmax(150px,.7fr)_auto]">
          <label className="relative">
            <span className="sr-only">Buscar prestador, serviço ou trabalho</span>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A899A]" size={18} />
            <input
              name="q"
              defaultValue={params.q}
              className="h-12 w-full rounded-2xl border border-[#CAD6E2] bg-white pl-10 pr-4 text-sm text-[#172033] outline-none transition focus:border-[#F2811D] focus:ring-4 focus:ring-[#F2811D]/10"
              placeholder="Prestador, serviço ou trabalho"
            />
          </label>
          <label>
            <span className="sr-only">Categoria ou subcategoria</span>
            <select
              name="category"
              defaultValue={params.category ?? ""}
              className="h-12 w-full rounded-2xl border border-[#CAD6E2] bg-white px-3 text-sm text-[#405168] outline-none transition focus:border-[#F2811D] focus:ring-4 focus:ring-[#F2811D]/10"
            >
              <option value="">Todas as categorias</option>
              {roots.map((root) => (
                <optgroup key={root.id} label={root.name}>
                  <option value={root.id}>{root.name}</option>
                  {children.filter((child) => child.parent_id === root.id).map((child) => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Cidade</span>
            <input
              name="city"
              defaultValue={params.city}
              className="h-12 w-full rounded-2xl border border-[#CAD6E2] bg-white px-4 text-sm text-[#172033] outline-none transition focus:border-[#F2811D] focus:ring-4 focus:ring-[#F2811D]/10"
              placeholder="Cidade"
            />
          </label>
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#F2811D] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(242,129,29,0.24)] transition hover:-translate-y-0.5 hover:bg-[#DD7010] active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2811D]/25">
            <SlidersHorizontal size={17} />Explorar
          </button>
        </div>
        {hasFilters ? (
          <div className="mt-2 flex justify-end">
            <Link href={basePath} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-[#607085] transition hover:bg-[#E8EFF5] hover:text-[#0F2D4E]">
              <X size={14} />Limpar filtros
            </Link>
          </div>
        ) : null}
      </form>

      {error ? (
        <section className="rounded-[28px] border border-[#F0C7C3] bg-[#FFF7F5] px-6 py-10 text-center">
          <Store className="mx-auto text-[#B5473E]" size={34} />
          <h2 className="mt-3 text-xl font-bold text-[#0F2D4E]">Não foi possível carregar a vitrine agora</h2>
          <p className="mt-2 text-sm text-[#607085]">Atualize a página em alguns instantes. Seus dados e conversas continuam seguros.</p>
        </section>
      ) : providers.length ? (
        <div className="space-y-7">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F2811D]">Destaques do Encaixe</p>
              <h2 className="mt-1 text-2xl font-bold text-[#0F2D4E]">Prestadores que conquistaram confiança</h2>
            </div>
            <p className="text-xs font-semibold text-[#7A899A]">Até 5 prestadores · ranking atualizado agora</p>
          </div>
          {providers.map((provider, index) => (
            <ProviderPostCarousel key={provider.provider_id} provider={provider} position={index + 1} />
          ))}
        </div>
      ) : (
        <section className="relative overflow-hidden rounded-[30px] border border-dashed border-[#BFCEDB] bg-[#F4F7FA] px-6 py-16 text-center">
          <div aria-hidden="true" className="absolute left-1/2 top-6 h-px w-48 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#F2811D] to-transparent" />
          <span className="mx-auto grid size-16 place-items-center rounded-[22px] bg-[#0F2D4E] text-white shadow-[0_14px_30px_rgba(15,45,78,0.2)]">
            <Store size={30} />
          </span>
          <h2 className="mt-5 text-2xl font-bold text-[#0F2D4E]">{hasFilters ? "Nenhum destaque combina com estes filtros" : "Em breve, os melhores prestadores estarão aqui"}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#607085]">
            {hasFilters
              ? "Tente outra categoria, cidade ou palavra-chave para ampliar sua descoberta."
              : "Assim que prestadores aprovados publicarem trabalhos e receberem avaliações reais, esta vitrine será preenchida automaticamente."}
          </p>
          {hasFilters ? <Link href={basePath} className="mt-5 inline-flex rounded-2xl bg-[#0F2D4E] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#173F69]">Ver todos os destaques</Link> : null}
        </section>
      )}
    </div>
  );
}

export function ExploreCarouselSkeleton() {
  return (
    <div className="space-y-7" aria-label="Carregando prestadores em destaque" aria-busy="true">
      <div className="h-44 animate-pulse rounded-[30px] bg-[#D9E4ED]" />
      <div className="h-[72px] animate-pulse rounded-[24px] bg-[#E5ECF2]" />
      {[1, 2].map((row) => (
        <div key={row} className="overflow-hidden rounded-[30px] border border-[#DFE7EE] bg-[#F9FBFC]">
          <div className="flex items-center gap-3 border-b border-[#E2E9EF] px-6 py-5">
            <div className="size-12 animate-pulse rounded-2xl bg-[#CFDAE4]" />
            <div className="space-y-2">
              <div className="h-4 w-44 animate-pulse rounded-full bg-[#CFDAE4]" />
              <div className="h-3 w-28 animate-pulse rounded-full bg-[#E0E7ED]" />
            </div>
          </div>
          <div className="flex gap-4 overflow-hidden p-6">
            {[1, 2, 3].map((card) => (
              <div key={card} className="w-[310px] shrink-0 overflow-hidden rounded-[24px] border border-[#E1E8EE] bg-white">
                <div className="aspect-[4/3] animate-pulse bg-[#D9E4ED]" />
                <div className="space-y-2 p-4">
                  <div className="h-3 animate-pulse rounded-full bg-[#DCE5EC]" />
                  <div className="h-3 w-4/5 animate-pulse rounded-full bg-[#E5EBF0]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
