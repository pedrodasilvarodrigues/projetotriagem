import Link from "next/link";
import { SearchX, Store } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/marketplace/explore";
import { ProviderCard, type ProviderSummary } from "@/components/marketplace/provider-card";
import { ProviderSearchFilters } from "@/components/marketplace/provider-search-filters";

export type ProviderSearchParams = {
  q?: string;
  category?: string;
  city?: string;
  mode?: string;
  rating?: string;
  page?: string;
};

const PAGE_SIZE = 24;
const validModes = new Set(["in_person", "remote", "both"]);

export async function ProviderSearch({
  params,
  basePath
}: {
  params: ProviderSearchParams;
  basePath: "/client/providers" | "/professional/providers";
}) {
  const supabase = await createServerClient();
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const categoryId = isUuid(params.category) ? params.category : null;
  const mode = validModes.has(params.mode ?? "") ? params.mode : null;
  const rating = Number(params.rating);
  const minimumRating = Number.isFinite(rating) && rating > 0 && rating <= 5 ? rating : null;

  const [{ data: providerRows, error }, { data: categories }] = await Promise.all([
    supabase.rpc("search_service_providers", {
      search_text: params.q?.trim() || null,
      target_category: categoryId,
      target_city: params.city?.trim() || null,
      target_mode: mode,
      minimum_rating: minimumRating,
      result_limit: PAGE_SIZE,
      result_offset: (page - 1) * PAGE_SIZE
    }),
    supabase
      .from("service_categories")
      .select("id,name,parent_id")
      .eq("is_active", true)
      .order("display_order")
      .order("name")
  ]);

  const providers = (providerRows ?? []) as ProviderSummary[];
  const hasNextPage = providers.length === PAGE_SIZE;
  const queryWithoutPage = new URLSearchParams();
  if (params.q) queryWithoutPage.set("q", params.q);
  if (params.category) queryWithoutPage.set("category", params.category);
  if (params.city) queryWithoutPage.set("city", params.city);
  if (params.mode) queryWithoutPage.set("mode", params.mode);
  if (params.rating) queryWithoutPage.set("rating", params.rating);

  function pageHref(targetPage: number) {
    const query = new URLSearchParams(queryWithoutPage);
    if (targetPage > 1) query.set("page", String(targetPage));
    const suffix = query.toString();
    return suffix ? `${basePath}?${suffix}` : basePath;
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-[#0F2D4E] px-6 py-8 text-white shadow-[0_20px_55px_rgba(15,45,78,0.18)]">
        <div aria-hidden="true" className="absolute -right-14 -top-16 size-52 rounded-full border-[34px] border-[#F2811D]/15" />
        <div className="relative max-w-3xl">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#FFB36E]"><Store size={15} />Marketplace de serviços</p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Encontre o prestador certo para o que você precisa</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#DCE8F2]">Todos os prestadores aprovados aparecem aqui. Pesquise pelo nome, serviço, especialidade, categoria ou cidade.</p>
        </div>
      </section>

      <ProviderSearchFilters basePath={basePath} categories={categories ?? []} values={params} />

      {error ? (
        <section className="rounded-[24px] border border-red-200 bg-red-50 p-8 text-center">
          <SearchX className="mx-auto text-red-600" size={34} />
          <h2 className="mt-3 text-xl font-bold text-[#0F2D4E]">Não foi possível carregar os prestadores</h2>
          <p className="mt-2 text-sm text-slate-600">Atualize a página e tente novamente.</p>
        </section>
      ) : providers.length ? (
        <>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F2811D]">Prestadores disponíveis</p>
              <h2 className="mt-1 text-2xl font-bold text-[#0F2D4E]">{page === 1 ? "Resultados encontrados" : `Página ${page}`}</h2>
            </div>
            <p className="text-sm font-semibold text-slate-500">{providers.length} nesta página</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {providers.map((provider) => <ProviderCard key={provider.provider_id} provider={provider} />)}
          </div>
          {(page > 1 || hasNextPage) ? (
            <nav aria-label="Paginação de prestadores" className="flex items-center justify-center gap-3 pt-2">
              {page > 1 ? <Link href={pageHref(page - 1)} className="rounded-xl border border-[#CAD6E2] bg-white px-4 py-2.5 text-sm font-bold text-[#0F2D4E] hover:border-[#F2811D]">Anterior</Link> : null}
              <span className="rounded-xl bg-[#E8EFF5] px-4 py-2.5 text-sm font-bold text-[#0F2D4E]">Página {page}</span>
              {hasNextPage ? <Link href={pageHref(page + 1)} className="rounded-xl bg-[#0F2D4E] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#173F69]">Próxima</Link> : null}
            </nav>
          ) : null}
        </>
      ) : (
        <section className="rounded-[28px] border border-dashed border-[#BFCEDB] bg-white px-6 py-14 text-center">
          <SearchX className="mx-auto text-[#F2811D]" size={38} />
          <h2 className="mt-4 text-2xl font-bold text-[#0F2D4E]">Nenhum prestador encontrado</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Tente outro nome, especialidade, categoria ou cidade. Somente prestadores aprovados e ativos aparecem na busca.</p>
          <Link href={basePath} className="mt-5 inline-flex rounded-xl bg-[#0F2D4E] px-5 py-3 text-sm font-bold text-white">Ver todos os prestadores</Link>
        </section>
      )}
    </div>
  );
}
