"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { PortalEncaixeLogo } from "@/components/app/logo";

const navItems = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/vagas-publicas", label: "Vagas públicas" },
  { href: "/empresas-parceiras", label: "Empresas parceiras" },
  { href: "/contato", label: "Contato" }
];

export function PublicHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${scrolled ? "border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md" : "border-transparent bg-white/45 backdrop-blur-sm"}`}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Portal Encaixe">
          <PortalEncaixeLogo />
        </Link>

        <nav aria-label="Navegação institucional" className="hidden items-center gap-6 text-sm font-bold text-slate-600 lg:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group relative rounded-full px-1 py-2 transition hover:text-[#0F2D4E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2811D]/50 ${active ? "text-[#0F2D4E]" : ""}`}
              >
                {item.label}
                <span className={`absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-[#F2811D] transition-transform duration-200 ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/login" className="btn-secondary rounded-xl bg-white px-4 py-2 text-xs shadow-sm sm:text-sm">
            Entrar
          </Link>
          <Link href="/register" className="btn-primary animate-pulse-glow rounded-xl px-4 py-2 text-xs shadow-md sm:text-sm">
            Cadastrar currículo
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="inline-flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-[#0F2D4E] shadow-sm transition hover:border-[#F2811D]/50 hover:text-[#F2811D] lg:hidden"
          aria-expanded={open}
          aria-controls="public-mobile-menu"
        >
          {open ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
          <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
        </button>
      </div>

      <div id="public-mobile-menu" className={`lg:hidden ${open ? "block" : "hidden"}`}>
        <div className="mx-4 mb-4 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-2xl shadow-slate-950/10 backdrop-blur">
          <nav aria-label="Navegação institucional mobile" className="grid gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${active ? "bg-[#0F2D4E] text-white" : "text-slate-700 hover:bg-[#F1F4F8] hover:text-[#0F2D4E]"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 grid gap-2 sm:hidden">
            <Link href="/register" className="btn-primary rounded-2xl px-4 py-3 text-center text-sm">
              Cadastrar currículo
            </Link>
            <Link href="/login" className="btn-secondary rounded-2xl px-4 py-3 text-center text-sm">
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
