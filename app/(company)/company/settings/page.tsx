import { AppShell } from "@/components/app/shell";
import { requestDataExportAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

export default async function CompanySettingsPage() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: requests } = await supabase.from("data_requests").select("id,request_type,status,created_at").eq("user_id", userData.user?.id).order("created_at", { ascending: false }).limit(5);

  return (
    <AppShell eyebrow="Empresa" title="Configuracoes">
      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <form action={requestDataExportAction} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">LGPD e dados da empresa</h2>
          <select name="requestType" className="field-input mt-5">
            <option value="export">Exportar dados</option>
            <option value="partial_anonymization">Anonimizacao parcial</option>
            <option value="account_deletion">Solicitar exclusao</option>
          </select>
          <button className="mt-4 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white" type="submit">Enviar solicitacao</button>
        </form>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Solicitacoes</h2>
          <table className="data-table mt-4">
            <thead><tr><th>Tipo</th><th>Status</th><th>Data</th></tr></thead>
            <tbody>
              {(requests ?? []).map((request) => <tr key={request.id}><td>{request.request_type}</td><td>{request.status}</td><td>{new Date(request.created_at).toLocaleDateString("pt-BR")}</td></tr>)}
              {(requests ?? []).length === 0 ? <tr><td colSpan={3}>Nenhuma solicitacao registrada.</td></tr> : null}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
