import { AppShell } from "@/components/app/shell";
import { updateCompanyStatusAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminCompaniesPage() {
  const supabase = await createServerClient();
  const { data: companies } = await supabase.from("companies").select("id,trade_name,legal_name,city,state,status,created_at").order("created_at", { ascending: false });

  return (
    <AppShell eyebrow="Administrador" title="Empresas cadastradas">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <table className="data-table">
          <thead><tr><th>Empresa</th><th>Local</th><th>Status</th><th>Acoes</th></tr></thead>
          <tbody>
            {(companies ?? []).map((company) => (
              <tr key={company.id}>
                <td><strong>{company.trade_name}</strong><p className="text-xs text-slate-500">{company.legal_name}</p></td>
                <td>{company.city}/{company.state}</td>
                <td>{company.status}</td>
                <td className="flex gap-2">
                  <form action={updateCompanyStatusAction}><input type="hidden" name="companyId" value={company.id} /><input type="hidden" name="status" value="approved" /><button className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white">Aprovar</button></form>
                  <form action={updateCompanyStatusAction}><input type="hidden" name="companyId" value={company.id} /><input type="hidden" name="status" value="suspended" /><button className="rounded bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Bloquear</button></form>
                </td>
              </tr>
            ))}
            {(companies ?? []).length === 0 ? <tr><td colSpan={4}>Nenhuma empresa cadastrada.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
