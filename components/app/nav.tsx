"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileText,
  GraduationCap,
  History,
  Landmark,
  LayoutGrid,
  LogOut,
  Menu,
  Plug,
  Search,
  Settings,
  ShieldCheck,
  UserRoundCheck,
  UserRoundCog,
  UserRoundSearch,
  X,
  type LucideIcon
} from "lucide-react";
import type { AppRole } from "@/lib/auth/access";
import { signOutAction } from "@/lib/actions/auth";
import { type AppLanguage, translateUi } from "@/lib/i18n/ui";
import { PortalEncaixeLogo } from "@/components/app/logo";

const navItems = {
  admin: {
    title: "Administração",
    subtitle: "Operação, triagem e acompanhamento",
    items: [
      { href: "/admin", label: "Painel", icon: LayoutGrid },
      { href: "/admin/professionals", label: "Profissionais", icon: UserRoundSearch },
      { href: "/admin/companies", label: "Empresas", icon: Building2 },
      { href: "/admin/demands", label: "Demandas", icon: BriefcaseBusiness },
      { href: "/admin/processes", label: "Processos", icon: ClipboardCheck },
      { href: "/admin/courses", label: "Cursos", icon: GraduationCap },
      { href: "/admin/reports", label: "Relatórios", icon: FileText },
      { href: "/admin/settings", label: "Configurações", icon: Settings },
      { href: "/admin/trainings", label: "Treinamentos", icon: ShieldCheck },
      { href: "/admin/institutions", label: "Instituições", icon: Landmark },
      { href: "/admin/integrations", label: "Integrações", icon: Plug }
    ]
  },
  company: {
    title: "Empresa",
    subtitle: "Demandas, candidatos e histórico",
    items: [
      { href: "/company", label: "Minha Empresa", icon: Building2 },
      { href: "/company/profile", label: "Perfil da Empresa", icon: UserRoundCog },
      { href: "/company/demands/new", label: "Criar Demanda", icon: BriefcaseBusiness },
      { href: "/company/demands", label: "Demandas Ativas", icon: ClipboardCheck },
      { href: "/company/candidates", label: "Análise de Candidatos", icon: UserRoundSearch },
      { href: "/company/history", label: "Histórico", icon: History },
      { href: "/company/notifications", label: "Notificações", icon: Bell },
      { href: "/company/settings", label: "Configurações", icon: Settings }
    ]
  },
  professional: {
    title: "Profissional",
    subtitle: "Perfil, triagem e encaminhamentos",
    items: [
      { href: "/professional", label: "Minha Área", icon: LayoutGrid },
      { href: "/professional/search-demands", label: "Buscar demandas", icon: Search },
      { href: "/professional/profile", label: "Perfil", icon: UserRoundCog },
      { href: "/professional/resume", label: "Currículo", icon: FileText },
      { href: "/professional/screening-status", label: "Situação da Triagem", icon: ClipboardCheck },
      { href: "/professional/referrals", label: "Encaminhamentos", icon: BriefcaseBusiness },
      { href: "/professional/notifications", label: "Notificações", icon: Bell },
      { href: "/professional/settings", label: "Configurações", icon: Settings }
    ]
  }
} satisfies Record<AppRole, { title: string; subtitle: string; items: Array<{ href: string; label: string; icon: LucideIcon }> }>;

export function AppNav({ role, preferredLanguage }: { role: AppRole; preferredLanguage: AppLanguage }) {
  const nav = navItems[role];
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const translated = useMemo(() => ({
    title: translateUi(nav.title, preferredLanguage),
    subtitle:
      preferredLanguage === "en-US"
        ? role === "company"
          ? "Demands, candidates and history"
          : role === "professional"
            ? "Profile, screening and referrals"
            : "Screening, talent pool and referrals"
        : preferredLanguage === "es-ES"
          ? role === "company"
            ? "Demandas, candidatos e historial"
            : role === "professional"
              ? "Perfil, seleccion y derivaciones"
              : "Seleccion, banco de talentos y derivaciones"
          : nav.subtitle
  }), [nav.subtitle, nav.title, preferredLanguage, role]);

  useEffect(() => {
    document.documentElement.lang = preferredLanguage;
  }, [preferredLanguage]);

  if (role === "admin") {
    return (
      <>
        <header className="sticky top-0 z-40 border-b-4 border-[#F2811D] bg-[#0F2D4E] text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)] lg:hidden">
          <div className="mx-auto max-w-7xl px-3 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <Link href="/admin" className="flex min-w-0 flex-1 items-center gap-3">
                <PortalEncaixeLogo />
              </Link>
              <button
                type="button"
                aria-controls="admin-mobile-sidebar"
                aria-expanded={isAdminMenuOpen}
                aria-label={isAdminMenuOpen ? "Fechar menu administrativo" : "Abrir menu administrativo"}
                onClick={() => setIsAdminMenuOpen((current) => !current)}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 border border-white/15 bg-white/8 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-[#F2811D] hover:text-white"
              >
                {isAdminMenuOpen ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
                <span>Menu</span>
              </button>
            </div>
          </div>
        </header>

        <div className={`fixed inset-0 z-50 lg:hidden ${isAdminMenuOpen ? "" : "pointer-events-none"}`} aria-hidden={!isAdminMenuOpen}>
          <button
            type="button"
            aria-label="Fechar menu administrativo"
            onClick={() => setIsAdminMenuOpen(false)}
            className={[
              "absolute inset-0 bg-slate-950/55 transition-opacity",
              isAdminMenuOpen ? "opacity-100" : "opacity-0"
            ].join(" ")}
          />
          <aside
            id="admin-mobile-sidebar"
            className={[
              "absolute inset-y-0 left-0 flex w-[min(86vw,20rem)] max-w-full flex-col border-r-4 border-[#F2811D] bg-[#0F2D4E] text-white shadow-[12px_0_32px_rgba(15,23,42,0.3)] transition-transform duration-200",
              isAdminMenuOpen ? "translate-x-0" : "-translate-x-full"
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
              <Link href="/admin" onClick={() => setIsAdminMenuOpen(false)} className="flex min-w-0 items-center gap-3">
                <PortalEncaixeLogo />
              </Link>
              <button
                type="button"
                aria-label="Fechar menu administrativo"
                onClick={() => setIsAdminMenuOpen(false)}
                className="inline-flex size-10 shrink-0 items-center justify-center border border-white/15 bg-white/8 text-slate-100 transition hover:border-[#F2811D] hover:text-white"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            <nav aria-label={`Menu ${translated.title}`} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
              {nav.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsAdminMenuOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "inline-flex min-h-11 w-full min-w-0 items-center gap-3 border px-3 py-2 text-sm font-semibold transition",
                      isActive
                        ? "border-[#F2811D] bg-[#F2811D] text-white"
                        : "border-transparent text-slate-200 hover:border-white/25 hover:bg-white/10 hover:text-white"
                    ].join(" ")}
                  >
                    <item.icon aria-hidden="true" className="shrink-0" size={18} />
                    <span className="min-w-0 truncate">{translateUi(item.label, preferredLanguage)}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/10 p-3">
              <form action={signOutAction}>
                <button className="inline-flex min-h-11 w-full min-w-0 items-center gap-3 border border-transparent px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-red-300/60 hover:bg-red-500/15 hover:text-white" type="submit">
                  <LogOut aria-hidden="true" size={18} />
                  <span className="min-w-0 truncate">{preferredLanguage === "en-US" ? "Sign out" : preferredLanguage === "es-ES" ? "Salir" : "Sair"}</span>
                </button>
              </form>
            </div>
          </aside>
        </div>

        <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r-4 border-[#F2811D] bg-[#0F2D4E] text-white shadow-[12px_0_32px_rgba(15,23,42,0.18)] lg:flex">
          <div className="border-b border-white/10 px-5 py-5">
            <Link href="/admin" className="flex items-center gap-3">
              <PortalEncaixeLogo />
            </Link>
          </div>

          <nav aria-label={`Menu ${translated.title}`} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
            {nav.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "inline-flex min-h-11 w-full items-center gap-3 border px-3 py-2 text-sm font-semibold transition",
                    isActive
                      ? "border-[#F2811D] bg-[#F2811D] text-white shadow-sm"
                      : "border-transparent text-slate-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  ].join(" ")}
                >
                  <item.icon aria-hidden="true" className="shrink-0" size={18} />
                  <span className="truncate">{translateUi(item.label, preferredLanguage)}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-3">
            <form action={signOutAction}>
              <button className="inline-flex min-h-11 w-full items-center gap-3 border border-transparent px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-red-300/60 hover:bg-red-500/15 hover:text-white" type="submit">
                <LogOut aria-hidden="true" size={18} />
                <span>{preferredLanguage === "en-US" ? "Sign out" : preferredLanguage === "es-ES" ? "Salir" : "Sair"}</span>
              </button>
            </form>
          </div>
        </aside>
      </>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b-4 border-[#F2811D] bg-[#0F2D4E] text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <Link href={nav.items[0].href} className="flex min-w-0 flex-1 items-center gap-3">
            <PortalEncaixeLogo />
          </Link>
          <button
            type="button"
            aria-expanded={!isCollapsed}
            onClick={() => setIsCollapsed((current) => !current)}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 border border-white/15 bg-white/8 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-[#F2811D] hover:text-white"
          >
            {isCollapsed ? <ChevronDown aria-hidden="true" size={16} /> : <ChevronUp aria-hidden="true" size={16} />}
            <span className="hidden sm:inline">{preferredLanguage === "en-US" ? (isCollapsed ? "Show menu" : "Collapse menu") : preferredLanguage === "es-ES" ? (isCollapsed ? "Mostrar menu" : "Ocultar menu") : (isCollapsed ? "Mostrar menu" : "Recolher menu")}</span>
            <span className="sm:hidden">Menu</span>
          </button>
        </div>

        <div className={`${isCollapsed ? "hidden" : "mt-4"}`}>
          <nav aria-label={`Menu ${translated.title}`} className="flex max-w-full gap-1 overflow-x-auto border border-white/15 bg-white/8 p-1">
            {nav.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== nav.items[0].href && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "inline-flex min-h-10 shrink-0 items-center justify-start gap-2 border px-3 py-2 text-left text-xs font-semibold transition sm:text-sm",
                    isActive
                      ? "border-[#F2811D] bg-[#F2811D] text-white"
                      : "border-transparent text-slate-200 hover:border-white/25 hover:bg-white/10 hover:text-white"
                  ].join(" ")}
                >
                  <item.icon aria-hidden="true" className="shrink-0" size={16} />
                  <span className="min-w-0 truncate">{translateUi(item.label, preferredLanguage)}</span>
                </Link>
              );
            })}
            <form action={signOutAction} className="shrink-0">
              <button className="inline-flex min-h-10 shrink-0 items-center justify-start gap-2 border border-transparent px-3 py-2 text-left text-xs font-semibold text-slate-200 transition hover:border-red-300/60 hover:bg-red-500/15 hover:text-white sm:text-sm" type="submit">
                <LogOut aria-hidden="true" size={16} />
                <span className="min-w-0 truncate">{preferredLanguage === "en-US" ? "Sign out" : preferredLanguage === "es-ES" ? "Salir" : "Sair"}</span>
              </button>
            </form>
          </nav>
        </div>
      </div>
    </header>
  );
}
