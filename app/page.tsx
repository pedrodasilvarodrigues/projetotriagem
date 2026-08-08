import { PublicHome, type PublicCompany, type PublicStats } from "@/components/app/public-home";
import { createPublicMetadata, SITE_NAME } from "@/lib/seo";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = createPublicMetadata({
  title: SITE_NAME,
  description: "Conecte seu currículo a oportunidades e encontre profissionais com triagem, compatibilidade e acompanhamento em um só portal.",
  path: "/",
  absoluteTitle: true
});

const fallbackStats: PublicStats = {
  professionals: 1500,
  companies: 120,
  screenings: 3000,
  referrals: 850
};

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getPublicHomeData(): Promise<{ stats: PublicStats; companies: PublicCompany[] }> {
  if (!hasSupabaseServerConfig()) {
    return { stats: fallbackStats, companies: [] };
  }

  try {
    const supabase = createAdminClient();
    const [professionals, companies, screenings, referrals, companyRows] = await Promise.all([
      supabase.from("professionals").select("id", { count: "exact", head: true }),
      supabase.from("companies").select("id", { count: "exact", head: true }),
      supabase.from("screening_processes").select("id", { count: "exact", head: true }),
      supabase.from("screening_processes").select("id", { count: "exact", head: true }).in("status", ["forwarded", "hired"]),
      supabase.from("companies").select("trade_name,legal_name,city,state").is("deleted_at", null).in("status", ["approved", "active"]).order("created_at", { ascending: false }).limit(10)
    ]);

    return {
      stats: {
        professionals: professionals.count ?? fallbackStats.professionals,
        companies: companies.count ?? fallbackStats.companies,
        screenings: screenings.count ?? fallbackStats.screenings,
        referrals: referrals.count ?? fallbackStats.referrals
      },
      companies:
        companyRows.data?.map((company) => ({
          name: company.trade_name || company.legal_name || "Empresa cadastrada",
          city: [company.city, company.state].filter(Boolean).join(", ") || "Brasil",
          sector: "Recrutamento e operação"
        })) ?? []
    };
  } catch {
    return { stats: fallbackStats, companies: [] };
  }
}

export default async function HomePage() {
  const data = await getPublicHomeData();
  return <PublicHome stats={data.stats} companies={data.companies} />;
}
