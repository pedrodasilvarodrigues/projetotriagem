import Link from "next/link";
import { PublicPageShell } from "@/components/app/public-page-shell";
import { createAdminClient } from "@/lib/supabase/admin";

async function getDemands() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("demands").select("id,title,city,state,modality,contract_type").eq("status", "active").order("created_at", { ascending: false }).limit(12);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function PublicJobsPage() {
  const demands = await getDemands();

  return (
    <PublicPageShell title="Vagas Publicas" description="Oportunidades que podem receber novos profissionais para triagem e compatibilidade.">
      <div className="grid gap-4 md:grid-cols-3">
        {demands.map((demand) => (
          <article key={demand.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">{demand.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{demand.city}/{demand.state} · {demand.modality} · {demand.contract_type}</p>
            <Link href="/register" className="mt-4 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Cadastrar perfil</Link>
          </article>
        ))}
        {demands.length === 0 ? <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">Nenhuma vaga publica ativa no momento.</p> : null}
      </div>
    </PublicPageShell>
  );
}
