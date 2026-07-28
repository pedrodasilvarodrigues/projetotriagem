import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  HandCoins,
  MessageCircle,
  Search,
  SearchCheck,
  SlidersHorizontal,
  Star,
  type LucideIcon
} from "lucide-react";
import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/app/public-page-shell";
import { ProviderCard, type ProviderSummary } from "@/components/marketplace/provider-card";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { createServerClient, hasSupabasePublicEnv } from "@/lib/supabase/server";
import { isMarketplaceEnabled } from "@/lib/features";
import { attachProviderCoverUrls } from "@/lib/marketplace/provider-media";

export const dynamic = "force-dynamic";

type InfoCard = {
  title: string;
  text: string;
  icon: LucideIcon;
};

const highlights: InfoCard[] = [
  {
    title: "Encontre o profissional certo",
    text: "Pesquise por serviço, especialidade, categoria, cidade, modalidade de atendimento e avaliação.",
    icon: SearchCheck
  },
  {
    title: "Conheça o trabalho antes",
    text: "Veja o perfil, as especialidades, os trabalhos publicados e a reputação de cada prestador aprovado.",
    icon: BadgeCheck
  },
  {
    title: "Converse dentro do portal",
    text: "Inicie uma conversa protegida e mantenha o histórico do contato organizado em um só lugar.",
    icon: MessageCircle
  }
];

const clientSteps = [
  "Busque o serviço ou profissional de que precisa.",
  "Confira perfil, trabalhos publicados e avaliações.",
  "Entre em contato e combine os detalhes diretamente."
];

const providerSteps = [
  "Crie uma conta profissional e ative a opção de oferecer serviços.",
  "Cadastre especialidades, área de atendimento e trabalhos realizados.",
  "Após a aprovação, seu perfil passa a aparecer nas buscas."
];

export default async function ServicesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  let providers: ProviderSummary[] = [];
  let categories: Array<{ id: string; name: string; parent_id: string | null }> = [];

  if (hasSupabasePublicEnv()) {
    const supabase = await createServerClient();
    if (!await isMarketplaceEnabled()) notFound();

    const catalogClient = hasSupabaseAdminEnv() ? createAdminClient() : supabase;
    const [providerResult, categoryResult] = await Promise.all([
      supabase.rpc("search_service_providers", {
        search_text: params.q || null,
        target_category: params.category || null,
        target_city: params.city || null,
        target_mode: params.mode || null,
        minimum_rating: params.rating ? Number(params.rating) : null,
        result_limit: 36,
        result_offset: 0
      }),
      catalogClient
        .from("service_categories")
        .select("id,name,parent_id")
        .eq("is_active", true)
        .order("display_order")
        .order("name")
    ]);

    providers = await attachProviderCoverUrls((providerResult.data ?? []) as ProviderSummary[]);
    categories = categoryResult.data ?? [];
  }

  return (
    <PublicPageShell
      eyebrow="Serviços"
      title="Serviços para o que você precisa. Profissionais para fazer acontecer."
      description="A área de serviços aproxima clientes e profissionais aprovados. Você pesquisa, conhece o trabalho, conversa pelo portal e combina a contratação diretamente com o prestador."
      primaryAction={{ href: "/register?type=client", label: "Encontrar um profissional" }}
      secondaryAction={{ href: "/register?type=professional", label: "Oferecer meus serviços" }}
      asideTitle="Por que usar?"
      asideItems={[
        "Somente prestadores aprovados aparecem na busca.",
        "Perfis reúnem trabalhos publicados e avaliações.",
        "Conversas e histórico ficam protegidos no portal."
      ]}
    >
      <section className="grid gap-6 lg:grid-cols-3">
        {highlights.map((item) => (
          <article
            key={item.title}
            className="group rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F2811D]/40 hover:shadow-2xl hover:shadow-[#0F2D4E]/8"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#F2811D]/10 text-[#F2811D] transition group-hover:bg-[#F2811D] group-hover:text-white">
              <item.icon aria-hidden="true" size={22} />
            </span>
            <h2 className="mt-5 font-display text-xl font-extrabold text-[#0F2D4E]">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <article className="rounded-[2rem] bg-[#0F2D4E] p-7 text-white shadow-2xl shadow-[#0F2D4E]/20">
          <SearchCheck aria-hidden="true" className="text-[#F2811D]" size={28} />
          <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.18em] text-[#F2811D]">Para contratar</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold">Encontre ajuda com mais contexto e confiança.</h2>
          <ol className="mt-5 space-y-3">
            {clientSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-7 text-slate-200">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-extrabold text-[#F2811D]">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <Link href="/register?type=client" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#F2811D] px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#F5A24D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30">
            Criar conta de cliente
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-7">
          <BriefcaseBusiness aria-hidden="true" className="text-[#F2811D]" size={28} />
          <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.18em] text-[#F2811D]">Para oferecer</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-[#0F2D4E]">Transforme sua experiência em uma vitrine profissional.</h2>
          <ol className="mt-5 space-y-3">
            {providerSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-7 text-slate-600">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F2811D]/10 text-xs font-extrabold text-[#B5520C]">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <Link href="/register?type=professional" className="btn-secondary mt-6 rounded-2xl bg-white px-5 py-3 text-sm">
            Cadastrar como profissional
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </article>
      </section>

      <section className="mt-10 rounded-[2rem] border border-[#F2811D]/20 bg-[#F2811D]/8 p-6">
        <div className="grid gap-5 md:grid-cols-[auto_minmax(0,1fr)_minmax(220px,0.45fr)] md:items-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-[#F2811D] shadow-sm">
            <HandCoins aria-hidden="true" size={23} />
          </span>
          <div>
            <h2 className="font-display text-xl font-extrabold text-[#0F2D4E]">Contratação e pagamento são combinados diretamente.</h2>
            <p className="mt-1 text-sm leading-7 text-slate-700">
              O Portal Encaixe facilita a descoberta, o contato e a reputação. Valores, prazos e forma de pagamento são acordados entre cliente e profissional.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/80 p-4">
            <Star aria-hidden="true" className="shrink-0 text-[#F2811D]" size={22} />
            <p className="text-sm font-bold leading-6 text-[#0F2D4E]">Avaliações reais ajudam nas próximas escolhas.</p>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#F2811D]">Prestadores disponíveis</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-[#0F2D4E]">Explore os serviços cadastrados</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">Use os filtros para encontrar profissionais aprovados por especialidade, categoria ou cidade.</p>
        </div>

        <form className="mb-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[2fr_1fr_1fr_auto]">
          <label className="relative">
            <span className="sr-only">Pesquisar</span>
            <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input
              name="q"
              defaultValue={params.q}
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#F2811D] focus:ring-4 focus:ring-[#F2811D]/10"
              placeholder="Nome, serviço ou especialidade"
            />
          </label>
          <select name="category" defaultValue={params.category ?? ""} className="rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-[#F2811D] focus:ring-4 focus:ring-[#F2811D]/10">
            <option value="">Todas as categorias</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <input
            name="city"
            defaultValue={params.city}
            className="rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-[#F2811D] focus:ring-4 focus:ring-[#F2811D]/10"
            placeholder="Cidade"
          />
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F2811D] px-5 py-3 font-bold text-white shadow-[0_10px_22px_rgba(242,129,29,0.2)] transition hover:-translate-y-0.5 hover:bg-[#DD7010] active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2811D]/25">
            <SlidersHorizontal aria-hidden="true" size={17} />
            Filtrar
          </button>
        </form>

        {providers.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {providers.map((provider) => <ProviderCard key={provider.provider_id} provider={provider} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-xl font-bold text-[#0F2D4E]">Nenhum prestador encontrado</h2>
            <p className="mt-2 text-slate-600">Ajuste os filtros ou tente outra palavra-chave.</p>
          </div>
        )}
      </section>
    </PublicPageShell>
  );
}
