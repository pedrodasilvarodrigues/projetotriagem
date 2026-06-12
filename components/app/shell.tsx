import { AppNav } from "@/components/app/nav";
import { requireRole, roleFromEyebrow } from "@/lib/auth/access";
import { createServerClient } from "@/lib/supabase/server";
import { type AppLanguage, translateUi } from "@/lib/i18n/ui";

export async function AppShell({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  const expectedRole = roleFromEyebrow(eyebrow);
  const role = expectedRole ? await requireRole(expectedRole) : "professional";
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: settings } = await supabase.from("user_settings").select("preferred_language").eq("user_id", userData.user?.id).maybeSingle();
  const language = (settings?.preferred_language ?? "pt-BR") as AppLanguage;

  return (
    <div className="min-h-screen bg-[#eef3f7] text-slate-950">
      <AppNav role={role} preferredLanguage={language} />
      <main id="conteudo" className="mx-auto min-w-0 max-w-7xl px-5 py-6">
        <header className="mb-6 border-l-4 border-[#d6a238] bg-transparent py-2 pl-4">
          <p className="text-xs font-bold uppercase tracking-normal text-[#38506f]">{translateUi(eyebrow, language)}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-[#18212f]">{translateUi(title, language)}</h1>
        </header>
        <section>{children}</section>
      </main>
    </div>
  );
}
