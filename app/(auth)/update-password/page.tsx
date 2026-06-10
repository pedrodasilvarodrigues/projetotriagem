import Link from "next/link";
import { BriefcaseBusiness, LockKeyhole } from "lucide-react";
import { updatePasswordAction } from "@/lib/actions/auth";

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const error = params.error ? decodeURIComponent(params.error) : null;

  return (
    <main id="conteudo" className="grid min-h-screen bg-slate-50 text-slate-950 lg:grid-cols-[minmax(0,1fr)_520px]">
      <section className="relative hidden overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=1500&q=85"
          alt="Ambiente corporativo com profissionais em reuniao"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/35" />
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
            <h1 className="text-3xl font-semibold tracking-normal">Criar nova senha</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Defina uma senha segura para voltar a acessar sua conta.</p>

            {error ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                {error}
              </div>
            ) : null}

            <form action={updatePasswordAction} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-800">
                Nova senha
                <span className="mt-1 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2.5 focus-within:border-blue-700">
                  <LockKeyhole aria-hidden="true" className="text-slate-400" size={17} />
                  <input name="password" required type="password" minLength={6} autoComplete="new-password" className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none" />
                </span>
              </label>
              <label className="block text-sm font-medium text-slate-800">
                Confirmar senha
                <span className="mt-1 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2.5 focus-within:border-blue-700">
                  <LockKeyhole aria-hidden="true" className="text-slate-400" size={17} />
                  <input name="confirmPassword" required type="password" minLength={6} autoComplete="new-password" className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none" />
                </span>
              </label>
              <button className="w-full rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800" type="submit">
                Atualizar senha
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
