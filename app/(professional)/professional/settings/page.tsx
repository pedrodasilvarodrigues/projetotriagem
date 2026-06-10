import Link from "next/link";
import { Bell, LockKeyhole, Mail, ShieldCheck, UserRoundCog } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { signOutAction } from "@/lib/actions/auth";
import { updateUserSettingsAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

export default async function ProfessionalSettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const [{ data: settings }, { data: profile }] = await Promise.all([
    supabase.from("user_settings").select("email_notifications,opportunity_alerts,profile_visible,allow_recruiter_contact,show_salary_expectation").eq("user_id", userData.user?.id).maybeSingle(),
    supabase.from("profiles").select("full_name,email,phone").eq("id", userData.user?.id).maybeSingle()
  ]);

  const prefs = {
    email_notifications: settings?.email_notifications ?? true,
    opportunity_alerts: settings?.opportunity_alerts ?? true,
    profile_visible: settings?.profile_visible ?? true,
    allow_recruiter_contact: settings?.allow_recruiter_contact ?? true,
    show_salary_expectation: settings?.show_salary_expectation ?? false
  };

  return (
    <AppShell eyebrow="Profissional" title="Configuracoes">
      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-blue-700">
              <UserRoundCog aria-hidden="true" size={18} />
              <h2 className="font-semibold">Conta</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <p><strong className="block text-slate-950">Nome</strong>{profile?.full_name ?? "Nao informado"}</p>
              <p><strong className="block text-slate-950">Email</strong>{profile?.email ?? userData.user?.email ?? "Nao informado"}</p>
              <p><strong className="block text-slate-950">Telefone</strong>{profile?.phone ?? "Nao informado"}</p>
            </div>
            <Link href="/professional/profile" className="mt-5 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Editar perfil</Link>
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
        </aside>

        <form action={updateUserSettingsAction} className="border border-slate-200 bg-white p-5 shadow-sm">
          <input type="hidden" name="redirectTo" value="/professional/settings" />
          {params.error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Nao foi possivel salvar as configuracoes.</p> : null}
          {params.message ? <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">Configuracoes atualizadas.</p> : null}

          <div className="grid gap-5 md:grid-cols-2">
            <section className="border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Bell aria-hidden="true" size={18} />
                <h2 className="font-semibold text-slate-950">Notificacoes</h2>
              </div>
              <label className="mt-4 flex items-start gap-3 text-sm font-medium">
                <input name="emailNotifications" type="checkbox" defaultChecked={prefs.email_notifications} className="mt-1 size-4" />
                <span><strong className="block">Emails da plataforma</strong><span className="text-slate-600">Receber avisos importantes sobre processos, triagens e mensagens.</span></span>
              </label>
              <label className="mt-4 flex items-start gap-3 text-sm font-medium">
                <input name="opportunityAlerts" type="checkbox" defaultChecked={prefs.opportunity_alerts} className="mt-1 size-4" />
                <span><strong className="block">Alertas de vagas</strong><span className="text-slate-600">Receber oportunidades de acordo com cidades, perfil e currículo.</span></span>
              </label>
            </section>

            <section className="border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <ShieldCheck aria-hidden="true" size={18} />
                <h2 className="font-semibold text-slate-950">Privacidade do perfil</h2>
              </div>
              <label className="mt-4 flex items-start gap-3 text-sm font-medium">
                <input name="profileVisible" type="checkbox" defaultChecked={prefs.profile_visible} className="mt-1 size-4" />
                <span><strong className="block">Perfil visivel para triagem</strong><span className="text-slate-600">Permitir que recrutadores internos encontrem seu currículo.</span></span>
              </label>
              <label className="mt-4 flex items-start gap-3 text-sm font-medium">
                <input name="allowRecruiterContact" type="checkbox" defaultChecked={prefs.allow_recruiter_contact} className="mt-1 size-4" />
                <span><strong className="block">Contato por recrutadores</strong><span className="text-slate-600">Permitir contato em processos compatíveis.</span></span>
              </label>
              <label className="mt-4 flex items-start gap-3 text-sm font-medium">
                <input name="showSalaryExpectation" type="checkbox" defaultChecked={prefs.show_salary_expectation} className="mt-1 size-4" />
                <span><strong className="block">Mostrar pretensao salarial</strong><span className="text-slate-600">Exibir essa informacao quando ela existir no perfil.</span></span>
              </label>
            </section>

            <section className="border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <div className="flex items-center gap-2 text-blue-700">
                <Mail aria-hidden="true" size={18} />
                <h2 className="font-semibold text-slate-950">Resumo das preferencias</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Essas configuracoes controlam como a plataforma envia avisos, recomenda vagas e exibe seu perfil dentro do processo de triagem.
              </p>
            </section>
          </div>

          <button className="mt-5 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white" type="submit">Salvar configuracoes</button>
        </form>
      </div>
    </AppShell>
  );
}
