import Link from "next/link";
import { AlertTriangle, LockKeyhole } from "lucide-react";
import { updatePasswordAction } from "@/lib/actions/auth";
import { PortalEncaixeLogo } from "@/components/app/logo";
import { createServerClient, hasSupabasePublicEnv } from "@/lib/supabase/server";

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const error = params.error ? decodeURIComponent(params.error) : null;
  let hasRecoverySession = false;

  if (hasSupabasePublicEnv()) {
    const supabase = await createServerClient();
    const { data } = await supabase.auth.getUser();
    hasRecoverySession = Boolean(data.user);
  }

  return (
    <main id="conteudo" className="grid min-h-screen bg-[#F1F4F8] text-slate-900 lg:grid-cols-[minmax(0,1fr)_520px]">
      <section className="relative hidden overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=1500&q=85"
          alt="Ambiente corporativo com profissionais em reunião"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0F2D4E]/30" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,45,78,0.20),rgba(15,45,78,0.80))]" />
      </section>

      <section className="flex items-center justify-center bg-[#FAFBFC] px-6 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-3">
            <PortalEncaixeLogo />
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_22px_70_rgba(15,23,42,0.06)]">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-blue-750">Criar nova senha</h1>
            <p className="font-sans mt-2 text-sm font-medium leading-6 text-slate-500">Defina uma senha segura para voltar a acessar sua conta.</p>

            {error ? (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">
                {error}
              </div>
            ) : null}

            {hasRecoverySession ? (
              <form action={updatePasswordAction} className="mt-6 space-y-4">
                <label className="block text-sm font-bold text-slate-800">
                  Nova senha
                  <span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 shadow-inner transition focus-within:border-orange-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100">
                    <LockKeyhole aria-hidden="true" className="text-slate-400" size={17} />
                    <input name="password" required type="password" minLength={6} autoComplete="new-password" className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400" placeholder="Mínimo 6 caracteres" />
                  </span>
                </label>
                <label className="block text-sm font-bold text-slate-800">
                  Confirmar senha
                  <span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 shadow-inner transition focus-within:border-orange-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100">
                    <LockKeyhole aria-hidden="true" className="text-slate-400" size={17} />
                    <input name="confirmPassword" required type="password" minLength={6} autoComplete="new-password" className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400" placeholder="Digite novamente" />
                  </span>
                </label>
                <button className="btn-primary w-full py-3.5 shadow-lg shadow-orange-500/10" type="submit">
                  Atualizar senha
                </button>
              </form>
            ) : (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="flex gap-3">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
                  <div>
                    <p className="font-bold">Link de recuperação inválido ou expirado.</p>
                    <p className="mt-1 leading-6">Para proteger sua conta, só mostramos o formulário quando o link enviado por e-mail cria uma sessão válida de recuperação.</p>
                  </div>
                </div>
                <Link href="/forgot-password" className="mt-4 inline-flex rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700">
                  Enviar novo link
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
