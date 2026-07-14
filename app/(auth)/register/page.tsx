import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, UserRoundCheck } from "lucide-react";
import { CompanyRegisterForm } from "@/components/auth/company-register-form";
import { ProfessionalRegisterForm } from "@/components/auth/professional-register-form";
import { signInWithGoogleAction } from "@/lib/actions/auth";
import { resolveAuthenticatedEntryPath } from "@/lib/auth/entry";
import { createServerClient } from "@/lib/supabase/server";
import { PortalEncaixeLogo } from "@/components/app/logo";

export const dynamic = "force-dynamic";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path fill="#4285F4" d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.32 2.98-7.52Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.45l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.58-4.12H3.08v2.59A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.42 13.88a6 6 0 0 1 0-3.76V7.53H3.08a10 10 0 0 0 0 8.94l3.34-2.59Z" />
      <path fill="#EA4335" d="M12 6c1.47 0 2.8.5 3.84 1.5l2.86-2.86A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.92 5.53l3.34 2.59C7.2 7.76 9.4 6 12 6Z" />
    </svg>
  );
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string; type?: string }> }) {
  let authenticatedRedirect: string | null = null;

  try {
    const supabase = await createServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const entryPath = await resolveAuthenticatedEntryPath(supabase, userData.user.id, userData.user.user_metadata).catch(() => null);
      authenticatedRedirect = entryPath ?? "/onboarding";
    }
  } catch (error) {
    console.error("[auth] Falha ao recuperar sessão na página de cadastro", { error: error instanceof Error ? error.message : String(error) });
  }

  if (authenticatedRedirect) redirect(authenticatedRedirect);

  const params = await searchParams;
  const error = params.error ? decodeURIComponent(params.error) : undefined;
  const accountType = params.type === "company" ? "company" : "professional";
  const isCompany = accountType === "company";

  return (
    <main id="conteudo" className="grid min-h-screen bg-[#F1F4F8] text-slate-900 lg:grid-cols-[minmax(0,0.88fr)_minmax(620px,1fr)]">
      <section className="relative hidden overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1500&q=85"
          alt="Reunião profissional para contratação"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/38" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,45,78,0.30),rgba(15,45,78,0.85))]" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <div className="max-w-lg">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold ring-1 ring-white/20">
              <CheckCircle2 aria-hidden="true" size={14} className="text-orange-400" />
              Cadastro gratuito
            </p>
            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-normal font-display">Um perfil completo aumenta a clareza da triagem e das oportunidades.</h1>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-start justify-center overflow-y-auto px-6 py-8">
        <div className="w-full max-w-2xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <PortalEncaixeLogo />
            </Link>
            <Link href="/login" className="btn-secondary py-2 px-4 rounded-xl text-xs sm:text-sm bg-white shadow-sm">
              Entrar
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)] sm:p-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-blue-750 font-display font-display">Crie sua conta</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 font-medium font-sans">Escolha o perfil adequado para acessar a área correta depois do login.</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href="/register?type=professional" className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${!isCompany ? "border-orange-500 bg-orange-50/50 text-blue-950 shadow-inner" : "border-slate-200 bg-white text-slate-700 hover:border-orange-200"}`}>
                <UserRoundCheck aria-hidden="true" className={!isCompany ? "text-orange-500" : "text-slate-500"} size={22} />
                <span>
                  <strong className="block text-sm font-bold text-blue-700 font-display">Sou Profissional</strong>
                  <span className="mt-1 block text-xs leading-5 text-slate-500 font-medium">Perfil, currículo e processos de encaminhamento.</span>
                </span>
              </Link>
              <Link href="/register?type=company" className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${isCompany ? "border-orange-500 bg-orange-50/50 text-blue-950 shadow-inner" : "border-slate-200 bg-white text-slate-700 hover:border-orange-200"}`}>
                <Building2 aria-hidden="true" className={isCompany ? "text-orange-500" : "text-slate-500"} size={22} />
                <span>
                  <strong className="block text-sm font-bold text-blue-700 font-display">Sou Empresa</strong>
                  <span className="mt-1 block text-xs leading-5 text-slate-500 font-medium">Cadastro de demandas privadas e candidatos apresentados.</span>
                </span>
              </Link>
            </div>

            <form action={signInWithGoogleAction} className="mt-6">
              <input type="hidden" name="accountType" value={accountType} />
              <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/50 hover:shadow-md" type="submit">
                <GoogleIcon />
                Continuar com Google como {isCompany ? "Empresa" : "Profissional"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase text-slate-350">
              <span className="h-px flex-1 bg-slate-200" />
              Cadastro com Email e Senha
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            {isCompany ? <CompanyRegisterForm error={error} /> : <ProfessionalRegisterForm error={error} />}
          </div>

          <div className="mt-5 rounded-2xl border border-[#dce7f0] bg-[#eef3f7] p-5 text-sm leading-6 text-blue-800 font-medium flex items-center gap-3">
            <span className="flex-1">Depois do cadastro, você poderá completar seu perfil e começar a usar a plataforma.</span>
            <ArrowRight aria-hidden="true" className="shrink-0 text-orange-500" size={18} />
          </div>
        </div>
      </section>
    </main>
  );
}
