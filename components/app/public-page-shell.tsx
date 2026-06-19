import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

export function PublicPageShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main id="conteudo" className="min-h-screen bg-[#eef3f7] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="flex size-10 items-center justify-center rounded-md bg-blue-700 text-white">
              <BriefcaseBusiness aria-hidden="true" size={20} />
            </span>
            Triagem Profissional
          </Link>
          <nav className="flex gap-4 text-sm font-semibold text-slate-600">
            <Link href="/sobre">Sobre</Link>
            <Link href="/como-funciona">Como Funciona</Link>
            <Link href="/vagas-publicas">Vagas Públicas</Link>
            <Link href="/empresas-parceiras">Empresas Parceiras</Link>
            <Link href="/login">Login</Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-normal">{title}</h1>
          <p className="mt-3 text-lg leading-8 text-slate-600">{description}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
