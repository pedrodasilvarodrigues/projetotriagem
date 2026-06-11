import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, Mail, ShieldCheck } from "lucide-react";
import { resendSignupConfirmationAction } from "@/lib/actions/auth";

const messageMap: Record<string, string> = {
  "email-enviado": "Se esse email estiver cadastrado e ainda nao confirmado, enviaremos um novo link de confirmacao."
};

const errorMap: Record<string, string> = {
  "email-invalido": "Informe um email valido.",
  "aguarde-um-minuto": "Aguarde cerca de 1 minuto antes de solicitar outro email. Essa protecao evita envios repetidos.",
  "email-ja-confirmado": "Esse email ja foi confirmado. Volte para o login e entre normalmente.",
  "configuracao-supabase-incompleta": "Configuracao do Supabase pendente. Verifique as variaveis de ambiente.",
  "erro-autenticacao": "Nao foi possivel reenviar a confirmacao agora. Tente novamente em instantes."
};

export default async function ConfirmEmailPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const error = params.error ? decodeURIComponent(params.error) : null;
  const message = params.message ? decodeURIComponent(params.message) : null;

  return (
    <main id="conteudo" className="grid min-h-screen bg-slate-50 text-slate-950 lg:grid-cols-[minmax(0,1fr)_520px]">
      <section className="relative hidden overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1500&q=85"
          alt="Profissionais trabalhando em uma plataforma digital"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/40" />
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-3 font-semibold">
            <span className="flex size-10 items-center justify-center rounded-md bg-blue-700 text-white">
              <BriefcaseBusiness aria-hidden="true" size={21} />
            </span>
            <span>Portal de Triagem</span>
          </Link>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                <ShieldCheck aria-hidden="true" size={21} />
              </span>
              <div>
                <h1 className="text-3xl font-semibold tracking-normal">Confirmar email</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Informe o email cadastrado para receber outro link de confirmacao.
                </p>
              </div>
            </div>

            {error ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                {errorMap[error] ?? error}
              </div>
            ) : null}

            {message ? (
              <div className="mt-5 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700" role="status">
                {messageMap[message] ?? message}
              </div>
            ) : null}

            <form action={resendSignupConfirmationAction} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-800">
                Email
                <span className="mt-1 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2.5 focus-within:border-blue-700">
                  <Mail aria-hidden="true" className="text-slate-400" size={17} />
                  <input name="email" required type="email" autoComplete="email" className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none" />
                </span>
              </label>
              <button className="w-full rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800" type="submit">
                Reenviar email de confirmacao
              </button>
            </form>

            <Link href="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
              <ArrowLeft aria-hidden="true" size={16} />
              Voltar para login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
