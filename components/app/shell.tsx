import { AppNav } from "@/components/app/nav";
import { LanguageRuntime } from "@/components/app/language-runtime";
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
  const mainClassName =
    role === "admin"
      ? "min-w-0 px-3 py-4 sm:px-5 sm:py-6 lg:ml-72 lg:max-w-none lg:px-8"
      : "mx-auto min-w-0 max-w-7xl px-3 py-4 sm:px-5 sm:py-6";

  return (
    <div className="min-h-screen bg-[#F1F4F8] text-slate-950">
      <LanguageRuntime preferredLanguage={language} />
      <AppNav role={role} preferredLanguage={language} />
      <main id="conteudo" className={mainClassName}>
        <header className="mb-4 border-l-4 border-[#F2811D] bg-transparent py-2 pl-3 sm:mb-6 sm:pl-4">
          <p className="text-xs font-bold uppercase tracking-normal text-[#6B7280]">{translateUi(eyebrow, language)}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-[#0F2D4E] sm:text-3xl">{translateUi(title, language)}</h1>
        </header>
        <section className="min-w-0">{children}</section>
      </main>
    </div>
  );
}
