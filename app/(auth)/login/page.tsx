import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Building2, CheckCircle2, LockKeyhole, Mail, ShieldCheck, UserRoundCheck } from "lucide-react";
import { signInWithEmailAction, signInWithGoogleAction } from "@/lib/actions/auth";
import { resolveAuthenticatedEntryPath } from "@/lib/auth/entry";
import { createServerClient, hasSupabasePublicEnv } from "@/lib/supabase/server";
import { PortalEncaixeLogo } from "@/components/app/logo";

const errorMessages: Record<string, string> = {
  "sessao-expirada": "Sua sessão expirou por segurança. Por favor, entre novamente para continuar sua jornada.",
  "nao-foi-possivel-iniciar-google": "Ops! Não conseguimos conectar sua conta Google no momento. Que tal usar e-mail e senha?",
  "credenciais-invalidas": "E-mail ou senha incorretos. Que tal tentar de novo ou recuperar sua senha?",
  "email-nao-confirmado": "Falta pouco! Confirme seu e-mail através do link que enviamos para você.",
  "conta-nao-cadastrada": "Ainda não encontramos essa conta por aqui. Que tal criar seu cadastro como Profissional ou Empresa?",
  "link-invalido": "O link de acesso expirou ou não é válido. Peça um novo link para continuar.",
  "configuracao-supabase-incompleta": "A conexão com a plataforma está sendo ativada. Volte em instantes para acessar.",
  "erro-servidor-login": "Tivemos um problema técnico ao tentar conectar. Nosso time já está trabalhando para corrigir.",
  "erro-autenticacao": "Não conseguimos autenticar seu acesso agora. Tente novamente em alguns segundos."
};

const messageMap: Record<string, string> = {
  "cadastro-criado": "Seu cadastro foi criado com sucesso! Agora é só entrar com seus dados.",
  "email-confirmado": "E-mail confirmado com sucesso! Seja bem-vindo ao portal.",
  "confirme-email": "Cadastro realizado! Enviamos um link de confirmação para o seu e-mail.",
  "senha-atualizada": "Sua senha foi atualizada. Agora você pode entrar com a nova senha.",
  saiu: "Você saiu da sua conta. Até logo!"
};

export const dynamic = "force-dynamic";

const highlights = [
  { label: "Perfis acompanhados", value: "+1500" },
  { label: "Empresas ativas", value: "+120" },
  { label: "Encaminhamentos", value: "+850" }
];

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

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const isSupabaseConfigured = hasSupabasePublicEnv();

  if (isSupabaseConfigured) {
    let authenticatedRedirect: string | null = null;

    try {
      const supabase = await createServerClient();
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const entryPath = await resolveAuthenticatedEntryPath(supabase, userData.user.id, userData.user.user_metadata).catch(() => null);
        authenticatedRedirect = entryPath ?? "/onboarding";
      }
    } catch (error) {
      console.error("[auth] Falha ao recuperar sessão na página de login", { error: error instanceof Error ? error.message : String(error) });
    }

    if (authenticatedRedirect) redirect(authenticatedRedirect);
  }

  const params = await searchParams;
  const error = params.error ? decodeURIComponent(params.error) : null;
  const message = params.message ? decodeURIComponent(params.message) : null;

  return (
    <main id="conteudo" className="min-h-screen bg-[#F1F4F8] text-slate-900 relative">
      <div className="fixed inset-0 grain-overlay opacity-[0.025] pointer-events-none z-[999]" />
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(480px,0.72fr)]">
        <section className="relative min-h-[360px] overflow-hidden lg:min-h-screen">
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1800&q=88"
            alt="Equipe profissional conversando em ambiente corporativo"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/52" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,45,78,0.30),rgba(15,45,78,0.85))]" />

          <div className="relative flex min-h-[360px] flex-col justify-between p-6 text-white sm:p-8 lg:min-h-screen lg:p-10">
            <Link href="/" className="flex w-fit items-center gap-3">
              <PortalEncaixeLogo lightText />
            </Link>

            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold ring-1 ring-white/20">
                <BadgeCheck aria-hidden="true" size={14} className="text-orange-400" />
                Acompanhamento profissional e privado
              </p>
              <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-tight tracking-normal lg:text-5xl font-display">
                Entre para acompanhar processos com clareza.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-blue-100/90 font-medium">
                Acesse sua área para visualizar oportunidades, situação da triagem, documentos e próximos passos em uma jornada organizada.
              </p>

              <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
                {highlights.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <strong className="block text-2xl font-extrabold tracking-tight text-white">{item.value}</strong>
                    <span className="mt-1 block text-xs leading-5 text-slate-300 font-semibold uppercase tracking-wider">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden max-w-xl gap-3 text-sm text-slate-300 md:flex">
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3.5 py-2 ring-1 ring-white/10 font-semibold text-xs">
                <ShieldCheck aria-hidden="true" size={14} className="text-orange-400" />
                LGPD
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3.5 py-2 ring-1 ring-white/10 font-semibold text-xs">
                <UserRoundCheck aria-hidden="true" size={14} className="text-orange-400" />
                Perfil validado
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3.5 py-2 ring-1 ring-white/10 font-semibold text-xs">
                <Building2 aria-hidden="true" size={14} className="text-orange-400" />
                Empresas cadastradas
              </span>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10 bg-[#FAFBFC] auth-split-right">
          <div className="w-full max-w-md">
            <div className="mb-5 flex items-center justify-between gap-4 lg:justify-end">
              <Link href="/" className="flex items-center gap-3 lg:hidden">
                <PortalEncaixeLogo />
              </Link>
              <Link href="/register" className="btn-secondary py-2 px-4 rounded-xl text-xs sm:text-sm">
                Criar Conta
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)] sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-500 font-display">Acesso ao portal</p>
                  <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-blue-750 font-display">Bem-vindo de volta</h2>
                </div>
                <div className="hidden size-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 sm:flex shadow-inner">
                  <LockKeyhole aria-hidden="true" size={23} />
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-500 font-medium">Acompanhe seus processos, oportunidades e encaminhamentos em um ambiente seguro.</p>

              {error ? (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 font-medium" role="alert">
                  {errorMessages[error] ?? error}
                  {error === "email-nao-confirmado" ? (
                    <Link href="/confirm-email" className="mt-2 block font-bold text-red-800 underline underline-offset-4">
                      Liberar acesso agora
                    </Link>
                  ) : null}
                </div>
              ) : null}

              {message ? (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 font-medium" role="status">
                  {messageMap[message] ?? message}
                  {message === "confirme-email" ? (
                    <Link href="/confirm-email" className="mt-2 block font-bold text-green-800 underline underline-offset-4">
                      Liberar acesso agora
                    </Link>
                  ) : null}
                </div>
              ) : null}

              {!isSupabaseConfigured ? (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" role="status">
                  Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel para liberar o acesso.
                </div>
              ) : null}

              <form action={signInWithEmailAction} className="mt-6 space-y-4">
                <label className="block text-sm font-bold text-slate-800">
                  Email
                  <span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 shadow-inner transition focus-within:border-orange-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100">
                    <Mail aria-hidden="true" className="text-slate-400" size={18} />
                    <input name="email" required type="email" autoComplete="email" placeholder="seu@email.com" className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 font-medium" />
                  </span>
                </label>
                <label className="block text-sm font-bold text-slate-800">
                  Senha
                  <span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 shadow-inner transition focus-within:border-orange-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100">
                    <LockKeyhole aria-hidden="true" className="text-slate-400" size={18} />
                    <input name="password" required type="password" minLength={6} autoComplete="current-password" placeholder="Digite sua senha" className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 font-medium" />
                  </span>
                </label>
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-xs font-bold text-orange-500 hover:underline">
                    Esqueci minha senha
                  </Link>
                </div>
                <button className="btn-primary w-full py-3.5 shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2" type="submit" disabled={!isSupabaseConfigured}>
                  Entrar
                  <ArrowRight aria-hidden="true" className="transition group-hover:translate-x-0.5" size={17} />
                </button>
              </form>

              <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase text-slate-350">
                <span className="h-px flex-1 bg-slate-200" />
                OU
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <form action={signInWithGoogleAction}>
                <button className="group flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/50 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:shadow-none disabled:hover:translate-y-0" type="submit" disabled={!isSupabaseConfigured}>
                  <GoogleIcon />
                  Continuar com Google
                  <ArrowRight aria-hidden="true" className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-orange-500" size={16} />
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-[#F1F4F8]/50 p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 shadow-inner">
                    <CheckCircle2 aria-hidden="true" size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-blue-750 font-display">Ainda não faz parte da comunidade?</p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500 font-semibold">Cadastre-se gratuitamente e entre em uma rede de profissionais e empresas em busca de novas oportunidades.</p>
                    <Link href="/register" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0F2D4E] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-blue-800">
                      Criar Cadastro
                      <ArrowRight aria-hidden="true" size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-slate-500 font-medium">
              Acesso protegido por Supabase Auth, consentimento LGPD e regras de permissão por perfil.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
