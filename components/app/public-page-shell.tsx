import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { PublicHeader } from "@/components/app/public-header";

export function PublicPageShell({
  title,
  description,
  eyebrow = "Portal Encaixe",
  children
}: {
  title: string;
  description: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <main id="conteudo" className="relative min-h-screen overflow-x-hidden bg-[#FAFBFC] text-slate-950">
      <div className="fixed inset-0 grain-overlay opacity-[0.018] pointer-events-none z-[999]" />
      <PublicHeader />

      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#FAFBFC] to-[#F1F4F8] pt-32 pb-14 md:pt-40 md:pb-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-24 top-24 size-80 rounded-full bg-[#F2811D]/14 blur-3xl" />
          <div className="absolute -left-24 bottom-0 size-80 rounded-full bg-[#1B4E78]/12 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#1B4E78]/20 to-transparent" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#F2811D]/20 bg-[#F2811D]/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#B5520C]">
              <Sparkles aria-hidden="true" size={14} />
              {eyebrow}
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-[#0F2D4E] sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              {description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="btn-primary rounded-2xl px-5 py-3 text-sm">
                Cadastrar currículo
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <Link href="/vagas-publicas" className="btn-secondary rounded-2xl bg-white px-5 py-3 text-sm">
                Ver vagas públicas
              </Link>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-2xl shadow-[#0F2D4E]/10 backdrop-blur">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#F2811D]">Por que cadastrar?</p>
            <ul className="mt-4 space-y-3 text-sm font-semibold text-slate-700">
              {[
                "Seu perfil entra no banco de talentos.",
                "A triagem cruza currículo, cidade e objetivo.",
                "Você acompanha encaminhamentos pelo portal."
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-[#F2811D]" size={18} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        {children}
      </section>
    </main>
  );
}
