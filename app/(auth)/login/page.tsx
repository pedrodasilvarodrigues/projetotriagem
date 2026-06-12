import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Building2, CheckCircle2, LockKeyhole, Mail, ShieldCheck, UserRoundCheck } from "lucide-react";
import { signInWithEmailAction, signInWithGoogleAction } from "@/lib/actions/auth";
import { resolveAuthenticatedEntryPath } from "@/lib/auth/entry";
import { createServerClient, hasSupabasePublicEnv } from "@/lib/supabase/server";

const errorMessages: Record<string, string> = {
  "sessao-expirada": "Sua sessao expirou. Entre novamente para continuar.",
  "nao-foi-possivel-iniciar-google": "Nao foi possivel iniciar o login com Google.",
  "credenciais-invalidas": "Email ou senha invalidos.",
  "email-nao-confirmado": "Seu email ainda nao foi confirmado.",
  "conta-nao-cadastrada": "Essa conta ainda nao possui cadastro no portal. Crie uma conta escolhendo Profissional ou Empresa.",
  "link-invalido": "Link invalido ou expirado. Solicite um novo acesso.",
  "configuracao-supabase-incompleta": "Configuracao do Supabase pendente. Adicione as variaveis de ambiente na Vercel para ativar o login.",
  "erro-servidor-login": "Nao foi possivel concluir o login agora. A equipe tecnica ja tem logs para investigar.",
  "erro-autenticacao": "Nao foi possivel entrar agora. Tente novamente em instantes."
};

const messageMap: Record<string, string> = {
  "cadastro-criado": "Cadastro criado. Entre com seu email e senha para acessar.",
  "email-confirmado": "Email confirmado. Entre com seu email e senha para acessar.",
  "confirme-email": "Cadastro criado. Confirme seu email e entre para continuar.",
  "senha-atualizada": "Senha atualizada com sucesso. Entre novamente.",
  saiu: "Voce saiu da sua conta."
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
        authenticatedRedirect = entryPath ?? "/auth/sign-out?reason=sem-perfil";
      }
    } catch (error) {
      console.error("[auth] Falha ao recuperar sessao na pagina de login", { error: error instanceof Error ? error.message : String(error) });
    }

    if (authenticatedRedirect) redirect(authenticatedRedirect);
  }

  const params = await searchParams;
  const error = params.error ? decodeURIComponent(params.error) : null;
  const message = params.message ? decodeURIComponent(params.message) : null;

  return (
    <main id="conteudo" className="min-h-screen bg-[#eef3f7] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(480px,0.72fr)]">
        <section className="relative min-h-[360px] overflow-hidden lg:min-h-screen">
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1800&q=88"
            alt="Equipe profissional conversando em ambiente corporativo"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/52" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.18),rgba(15,23,42,0.72))]" />

          <div className="relative flex min-h-[360px] flex-col justify-between p-6 text-white sm:p-8 lg:min-h-screen lg:p-10">
            <Link href="/" className="flex w-fit items-center gap-3 font-semibold">
              <span className="flex size-11 items-center justify-center rounded-md bg-white text-blue-700 shadow-sm">
                <BriefcaseBusiness aria-hidden="true" size={22} />
              </span>
              <span>Portal de Triagem</span>
            </Link>

            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-md bg-white/14 px-3 py-1.5 text-sm font-medium ring-1 ring-white/20">
                <BadgeCheck aria-hidden="true" size={16} />
                Acompanhamento profissional e privado
              </p>
              <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-normal lg:text-5xl">
                Entre para acompanhar processos com clareza.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-blue-50">
                Acesse sua area para visualizar oportunidades, status de triagem, documentos e proximos passos em uma jornada organizada.
              </p>

              <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
                {highlights.map((item) => (
                  <div key={item.label} className="rounded-lg border border-white/18 bg-white/12 p-4 backdrop-blur">
                    <strong className="block text-2xl font-semibold tracking-normal">{item.value}</strong>
                    <span className="mt-1 block text-xs leading-5 text-blue-50">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden max-w-xl gap-3 text-sm text-blue-50 md:flex">
              <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 ring-1 ring-white/15">
                <ShieldCheck aria-hidden="true" size={16} />
                LGPD
              </span>
              <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 ring-1 ring-white/15">
                <UserRoundCheck aria-hidden="true" size={16} />
                Perfil validado
              </span>
              <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 ring-1 ring-white/15">
                <Building2 aria-hidden="true" size={16} />
                Empresas cadastradas
              </span>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-5 flex items-center justify-between gap-4 lg:justify-end">
              <Link href="/" className="flex items-center gap-3 font-semibold lg:hidden">
                <span className="flex size-10 items-center justify-center rounded-md bg-blue-700 text-white">
                  <BriefcaseBusiness aria-hidden="true" size={21} />
                </span>
                <span>Portal de Triagem</span>
              </Link>
              <Link href="/register" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700">
                Criar Conta
              </Link>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.13)] sm:p-7">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-blue-700">Acesso ao portal</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-normal">Bem-vindo de volta</h2>
                </div>
                <div className="hidden size-12 items-center justify-center rounded-md bg-blue-50 text-blue-700 sm:flex">
                  <LockKeyhole aria-hidden="true" size={23} />
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-600">Acompanhe seus processos, oportunidades e encaminhamentos em um ambiente seguro.</p>

              {error ? (
                <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                  {errorMessages[error] ?? error}
                  {error === "email-nao-confirmado" ? (
                    <Link href="/confirm-email" className="mt-2 block font-semibold text-red-800 underline underline-offset-4">
                      Liberar acesso agora
                    </Link>
                  ) : null}
                </div>
              ) : null}

              {message ? (
                <div className="mt-5 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700" role="status">
                  {messageMap[message] ?? message}
                  {message === "confirme-email" ? (
                    <Link href="/confirm-email" className="mt-2 block font-semibold text-green-800 underline underline-offset-4">
                      Liberar acesso agora
                    </Link>
                  ) : null}
                </div>
              ) : null}

              {!isSupabaseConfigured ? (
                <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" role="status">
                  Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel para liberar o acesso.
                </div>
              ) : null}

              <form action={signInWithEmailAction} className="mt-6 space-y-4">
                <label className="block text-sm font-semibold text-slate-800">
                  Email
                  <span className="mt-2 flex items-center gap-3 rounded-md border border-slate-300 bg-slate-50 px-3 py-3 shadow-inner transition focus-within:border-blue-700 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                    <Mail aria-hidden="true" className="text-slate-400" size={18} />
                    <input name="email" required type="email" autoComplete="email" placeholder="seu@email.com" className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400" />
                  </span>
                </label>
                <label className="block text-sm font-semibold text-slate-800">
                  Senha
                  <span className="mt-2 flex items-center gap-3 rounded-md border border-slate-300 bg-slate-50 px-3 py-3 shadow-inner transition focus-within:border-blue-700 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                    <LockKeyhole aria-hidden="true" className="text-slate-400" size={18} />
                    <input name="password" required type="password" minLength={6} autoComplete="current-password" placeholder="Digite sua senha" className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400" />
                  </span>
                </label>
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm font-semibold text-blue-700 hover:underline">
                    Esqueci minha senha
                  </Link>
                </div>
                <button className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(29,78,216,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-[0_18px_42px_rgba(29,78,216,0.34)] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:hover:translate-y-0" type="submit" disabled={!isSupabaseConfigured}>
                  Entrar
                  <ArrowRight aria-hidden="true" className="transition group-hover:translate-x-0.5" size={17} />
                </button>
              </form>

              <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                OU
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <form action={signInWithGoogleAction}>
                <button className="group flex w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:shadow-none disabled:hover:translate-y-0" type="submit" disabled={!isSupabaseConfigured}>
                  <GoogleIcon />
                  Continuar com Google
                  <ArrowRight aria-hidden="true" className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700" size={16} />
                </button>
              </form>

              <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-white text-blue-700 shadow-sm">
                    <CheckCircle2 aria-hidden="true" size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Ainda nao faz parte da comunidade?</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Cadastre-se gratuitamente e entre em uma rede de profissionais e empresas em busca de novas oportunidades.</p>
                    <Link href="/register" className="mt-4 inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800">
                      Criar Cadastro
                      <ArrowRight aria-hidden="true" size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-slate-500">
              Acesso protegido por Supabase Auth, consentimento LGPD e regras de permissao por perfil.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
