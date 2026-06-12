import Link from "next/link";
import { LockKeyhole, Mail, UserRoundCog } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SettingsPreferences } from "@/components/professional/settings-preferences";
import { signOutAction } from "@/lib/actions/auth";
import { requestDataExportAction, updateUserSettingsAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

export default async function CompanySettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const [{ data: requests }, { data: settings }, { data: company }] = await Promise.all([
    supabase.from("data_requests").select("id,request_type,status,created_at").eq("user_id", userData.user?.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("user_settings").select("email_notifications,opportunity_alerts,profile_visible,allow_recruiter_contact,show_salary_expectation,preferred_language").eq("user_id", userData.user?.id).maybeSingle(),
    supabase.from("companies").select("trade_name,corporate_email,phone").eq("owner_id", userData.user?.id).maybeSingle()
  ]);

  const prefs = {
    email_notifications: settings?.email_notifications ?? true,
    opportunity_alerts: settings?.opportunity_alerts ?? true,
    profile_visible: settings?.profile_visible ?? true,
    allow_recruiter_contact: settings?.allow_recruiter_contact ?? true,
    show_salary_expectation: settings?.show_salary_expectation ?? false,
    preferred_language: settings?.preferred_language ?? "pt-BR"
  };

  return (
    <AppShell eyebrow="Empresa" title="Configuracoes">
      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-blue-700">
              <UserRoundCog aria-hidden="true" size={18} />
              <h2 className="font-semibold">Conta empresarial</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <p><strong className="block text-slate-950">Empresa</strong>{company?.trade_name ?? "Nao informado"}</p>
              <p><strong className="block text-slate-950">Email corporativo</strong>{company?.corporate_email ?? userData.user?.email ?? "Nao informado"}</p>
              <p><strong className="block text-slate-950">Telefone</strong>{company?.phone ?? "Nao informado"}</p>
            </div>
            <Link href="/company/profile" className="mt-5 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Editar perfil</Link>
          </section>

          <section className="border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-blue-700">
              <LockKeyhole aria-hidden="true" size={18} />
              <h2 className="font-semibold">Acesso</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">Gerencie senha e sessao da sua conta.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/forgot-password" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Alterar senha</Link>
              <form action={signOutAction}>
                <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" type="submit">Sair da conta</button>
              </form>
            </div>
          </section>

          <form action={requestDataExportAction} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Solicitacoes de dados</h2>
            <select name="requestType" className="field-input mt-5">
              <option value="export">Exportar dados</option>
              <option value="partial_anonymization">Anonimizacao parcial</option>
              <option value="account_deletion">Solicitar exclusao</option>
            </select>
            <button className="mt-4 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white" type="submit">Enviar solicitacao</button>
          </form>
        </aside>

        <div className="space-y-5">
          <form action={updateUserSettingsAction} className="border border-slate-200 bg-white p-5 shadow-sm">
            <input type="hidden" name="redirectTo" value="/company/settings" />
            {params.error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Nao foi possivel salvar as configuracoes.</p> : null}
            {params.message ? <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">Configuracoes atualizadas.</p> : null}

            <SettingsPreferences
              prefs={prefs}
              labels={{
                notificationsDescription: "Emails da plataforma e alertas sobre demandas e candidatos.",
                alertsTitle: "Alertas operacionais",
                alertsDescription: "Receber avisos de movimentacao em demandas, triagens e candidatos.",
                privacyTitle: "Visibilidade empresarial",
                privacyDescription: "Controle como a plataforma utiliza seu perfil empresarial.",
                profileVisibleTitle: "Empresa visivel internamente",
                profileVisibleDescription: "Permitir que recrutadores internos usem seu perfil nas operacoes da plataforma.",
                recruiterContactTitle: "Contato da equipe",
                recruiterContactDescription: "Permitir que a equipe de triagem entre em contato sobre demandas e candidatos.",
                salaryTitle: "Exibir expectativas de faixas",
                salaryDescription: "Exibir informacoes complementares quando a demanda utilizar faixas e preferencias."
              }}
            />

            <section className="mt-5 border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Mail aria-hidden="true" size={18} />
                <h2 className="font-semibold text-slate-950">Resumo das preferencias</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Essas configuracoes controlam como a plataforma envia avisos, apresenta seu ambiente e aplica a preferencia de idioma.
              </p>
            </section>

            <button className="mt-5 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white" type="submit">Salvar configuracoes</button>
          </form>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Solicitacoes recentes</h2>
            <table className="data-table mt-4">
              <thead><tr><th>Tipo</th><th>Status</th><th>Data</th></tr></thead>
              <tbody>
                {(requests ?? []).map((request) => <tr key={request.id}><td>{request.request_type}</td><td>{request.status}</td><td>{new Date(request.created_at).toLocaleDateString("pt-BR")}</td></tr>)}
                {(requests ?? []).length === 0 ? <tr><td colSpan={3}>Nenhuma solicitacao registrada.</td></tr> : null}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
