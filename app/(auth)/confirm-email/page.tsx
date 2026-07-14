import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { resendSignupConfirmationAction } from "@/lib/actions/auth";
import { PortalEncaixeLogo } from "@/components/app/logo";

const messageMap: Record<string, string> = {
  "email-enviado": "Se esse email estiver cadastrado e ainda não confirmado, enviaremos um novo link de confirmação."
};

const errorMap: Record<string, string> = {
  "email-invalido": "Informe um email válido.",
  "aguarde-um-minuto": "Aguarde cerca de 1 minuto antes de solicitar outro email. Essa proteção evita envios repetidos.",
  "email-ja-confirmado": "Esse e-mail já foi confirmado. Volte para a página de acesso e entre normalmente.",
  "configuracao-supabase-incompleta": "Configuração do Supabase pendente. Verifique as variáveis de ambiente.",
  "erro-autenticacao": "Não foi possível reenviar a confirmação agora. Tente novamente em instantes."
};

export default async function ConfirmEmailPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const error = params.error ? decodeURIComponent(params.error) : null;
  const message = params.message ? decodeURIComponent(params.message) : null;

  return (
    <main id="conteudo" className="grid min-h-screen bg-[#F1F4F8] text-slate-900 lg:grid-cols-[minmax(0,1fr)_520px]">
      <section className="relative hidden overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1500&q=85"
          alt="Profissionais trabalhando em uma plataforma digital"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0F2D4E]/30" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,45,78,0.20),rgba(15,45,78,0.80))]" />
      </section>

      <section className="flex items-center justify-center px-6 py-10 bg-[#FAFBFC]">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-3">
            <PortalEncaixeLogo />
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 shadow-inner">
                <ShieldCheck aria-hidden="true" size={21} />
              </span>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-blue-750 font-display">Liberar acesso</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500 font-medium">
                  Informe o e-mail cadastrado para confirmar o acesso. Quando possível, a liberação acontece automaticamente.
                </p>
              </div>
            </div>

            {error ? (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 font-medium" role="alert">
                {errorMap[error] ?? error}
              </div>
            ) : null}

            {message ? (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 font-medium" role="status">
                {messageMap[message] ?? message}
              </div>
            ) : null}

            <form action={resendSignupConfirmationAction} className="mt-6 space-y-4">
              <label className="block text-sm font-bold text-slate-800">
                Email
                <span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 shadow-inner transition focus-within:border-orange-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100">
                  <Mail aria-hidden="true" className="text-slate-400" size={17} />
                  <input name="email" required type="email" autoComplete="email" className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 font-medium" placeholder="seu@email.com" />
                </span>
              </label>
              <button className="btn-primary w-full py-3.5 shadow-lg shadow-orange-500/10" type="submit">
                Confirmar acesso
              </button>
            </form>

            <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-orange-500 hover:underline">
              <ArrowLeft aria-hidden="true" size={16} />
              Voltar para login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
