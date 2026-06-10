import { PublicPageShell } from "@/components/app/public-page-shell";
import { createAdminClient } from "@/lib/supabase/admin";

async function getCompanies() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("companies").select("id,trade_name,city,state,segment,description").eq("status", "approved").order("created_at", { ascending: false }).limit(12);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function PartnerCompaniesPage() {
  const companies = await getCompanies();

  return (
    <PublicPageShell title="Empresas Parceiras" description="Empresas cadastradas e aprovadas para registrar demandas privadas e receber profissionais encaminhados.">
      <div className="grid gap-4 md:grid-cols-3">
        {companies.map((company) => (
          <article key={company.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">{company.trade_name}</h2>
            <p className="mt-2 text-sm text-slate-600">{company.city}/{company.state} · {company.segment ?? "Segmento em validacao"}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{company.description ?? "Empresa parceira da plataforma."}</p>
          </article>
        ))}
        {companies.length === 0 ? <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">Nenhuma empresa parceira publica no momento.</p> : null}
      </div>
    </PublicPageShell>
  );
}
