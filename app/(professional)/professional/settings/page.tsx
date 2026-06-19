import Link from "next/link";
import { LockKeyhole, Mail, UserRoundCog } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SettingsPreferences } from "@/components/professional/settings-preferences";
import { signOutAction } from "@/lib/actions/auth";
import { updateUserSettingsAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

export default async function ProfessionalSettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const [{ data: settings }, { data: profile }] = await Promise.all([
    supabase.from("user_settings").select("email_notifications,opportunity_alerts,profile_visible,allow_recruiter_contact,show_salary_expectation,preferred_language").eq("user_id", userData.user?.id).maybeSingle(),
    supabase.from("profiles").select("full_name,email,phone").eq("id", userData.user?.id).maybeSingle()
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
    <AppShell eyebrow="Profissional" title="Configurações">
      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-blue-700">
              <UserRoundCog aria-hidden="true" size={18} />
              <h2 className="font-semibold">Conta</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <p><strong className="block text-slate-950">Nome</strong>{profile?.full_name ?? "Não informado"}</p>
              <p><strong className="block text-slate-950">Email</strong>{profile?.email ?? userData.user?.email ?? "Não informado"}</p>
              <p><strong className="block text-slate-950">Telefone</strong>{profile?.phone ?? "Não informado"}</p>
            </div>
            <Link href="/professional/profile" className="mt-5 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Editar perfil</Link>
          </section>

          <section className="border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-blue-700">
              <LockKeyhole aria-hidden="true" size={18} />
              <h2 className="font-semibold">Acesso</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">Gerencie senha e sessão da sua conta.</p>
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
          {params.error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Não foi possível salvar as configurações.</p> : null}
          {params.message ? <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">Configurações atualizadas.</p> : null}

          <div className="grid gap-5">
            <SettingsPreferences prefs={prefs} />

            <section className="border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Mail aria-hidden="true" size={18} />
                <h2 className="font-semibold text-slate-950">Resumo das preferências</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Essas configurações controlam como a plataforma envia avisos, recomenda vagas, exibe seu perfil e prepara sua experiência de idioma.
              </p>
            </section>
          </div>

          <button className="mt-5 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white" type="submit">Salvar configurações</button>
        </form>
      </div>
    </AppShell>
  );
}
