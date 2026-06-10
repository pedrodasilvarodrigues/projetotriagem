import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

export default async function CompanyDemandsPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data: demands } = await supabase.from("demands").select("id,title,status,openings,city,state,created_at").in("status", ["active", "screening", "draft"]).order("created_at", { ascending: false });

  return (
    <AppShell eyebrow="Empresa" title="Demandas Ativas">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            {params.message ? <p className="mb-2 rounded-md bg-green-50 p-2 text-sm text-green-700">Demanda criada.</p> : null}
            <p className="text-sm text-slate-600">Demandas privadas visiveis apenas para sua empresa e recrutadores da plataforma.</p>
          </div>
          <Link href="/company/demands/new" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Criar demanda</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Cargo</th><th>Vagas</th><th>Local</th><th>Status</th><th>Criada em</th></tr></thead>
            <tbody>
              {(demands ?? []).map((demand) => <tr key={demand.id}><td>{demand.title}</td><td>{demand.openings}</td><td>{demand.city}/{demand.state}</td><td>{demand.status}</td><td>{new Date(demand.created_at).toLocaleDateString("pt-BR")}</td></tr>)}
              {(demands ?? []).length === 0 ? <tr><td colSpan={5}>Nenhuma demanda ativa cadastrada.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
