import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { defaultRouteForRole } from "@/lib/auth/routes";

export default async function AccessDeniedPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const params = await searchParams;
  const home = defaultRouteForRole(params.role);

  return (
    <main id="conteudo" className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-md bg-red-50 text-red-700">
          <ShieldAlert aria-hidden="true" size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-normal">Acesso negado</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Seu perfil nao possui permissao para visualizar este ambiente. Cada area do portal e separada por funcao.
        </p>
        <Link href={home} className="mt-6 inline-flex rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white">
          Voltar para minha area
        </Link>
      </section>
    </main>
  );
}
