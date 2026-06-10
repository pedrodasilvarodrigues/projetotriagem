"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  FileText,
  History,
  LayoutGrid,
  LogOut,
  Settings,
  ShieldCheck,
  UserRoundCheck,
  UserRoundCog,
  UserRoundSearch,
  type LucideIcon
} from "lucide-react";
import type { AppRole } from "@/lib/auth/access";
import { signOutAction } from "@/lib/actions/auth";

const navItems = {
  admin: {
    title: "Recrutador",
    subtitle: "Triagem, banco de talentos e encaminhamento",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutGrid },
      { href: "/admin/new-candidates", label: "Novos candidatos", icon: UserRoundCheck },
      { href: "/admin/companies", label: "Empresas cadastradas", icon: Building2 },
      { href: "/admin/demands", label: "Demandas abertas", icon: BriefcaseBusiness },
      { href: "/admin/referrals", label: "Encaminhamentos", icon: ClipboardCheck },
      { href: "/admin/hirings", label: "Contratacoes", icon: ShieldCheck },
      { href: "/admin/talent-bank", label: "Banco de Talentos", icon: UserRoundSearch },
      { href: "/admin/candidates", label: "Gestao de Candidatos", icon: UserRoundCog }
    ]
  },
  company: {
    title: "Empresa",
    subtitle: "Demandas, candidatos e historico",
    items: [
      { href: "/company", label: "Minha Empresa", icon: Building2 },
      { href: "/company/profile", label: "Perfil da Empresa", icon: UserRoundCog },
      { href: "/company/demands/new", label: "Criar Demanda", icon: BriefcaseBusiness },
      { href: "/company/demands", label: "Demandas Ativas", icon: ClipboardCheck },
      { href: "/company/candidates", label: "Candidatos Encaminhados", icon: UserRoundSearch },
      { href: "/company/history", label: "Historico", icon: History },
      { href: "/company/notifications", label: "Notificacoes", icon: Bell },
      { href: "/company/settings", label: "Configuracoes", icon: Settings }
    ]
  },
  professional: {
    title: "Profissional",
    subtitle: "Perfil, triagem e encaminhamentos",
    items: [
      { href: "/professional", label: "Minha Area", icon: LayoutGrid },
      { href: "/professional/profile", label: "Perfil", icon: UserRoundCog },
      { href: "/professional/resume", label: "Curriculo", icon: FileText },
      { href: "/professional/screening-status", label: "Status de Triagem", icon: ClipboardCheck },
      { href: "/professional/referrals", label: "Encaminhamentos", icon: BriefcaseBusiness },
      { href: "/professional/notifications", label: "Notificacoes", icon: Bell },
      { href: "/professional/settings", label: "Configuracoes", icon: Settings }
    ]
  }
} satisfies Record<AppRole, { title: string; subtitle: string; items: Array<{ href: string; label: string; icon: LucideIcon }> }>;

export function AppNav({ role }: { role: AppRole }) {
  const nav = navItems[role];
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b-4 border-[#d6a238] bg-[#18212f] text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
      <div className="mx-auto max-w-7xl px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href={nav.items[0].href} className="flex min-w-[230px] items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded border border-white/20 bg-[#d6a238] text-[#18212f]">
              <BriefcaseBusiness aria-hidden="true" size={20} />
            </span>
            <span>
              <span className="block text-sm font-semibold uppercase tracking-normal">Triagem Profissional</span>
              <span className="block text-xs text-slate-300">{nav.subtitle}</span>
            </span>
          </Link>
          <nav aria-label={`Menu ${nav.title}`} className="flex max-w-full gap-1 overflow-x-auto border border-white/15 bg-white/8 p-1">
            {nav.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== nav.items[0].href && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "inline-flex min-h-10 shrink-0 items-center gap-2 border px-3 py-2 text-sm font-semibold transition",
                    isActive
                      ? "border-[#d6a238] bg-[#d6a238] text-[#18212f]"
                      : "border-transparent text-slate-200 hover:border-white/25 hover:bg-white/10 hover:text-white"
                  ].join(" ")}
                >
                  <item.icon aria-hidden="true" size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <form action={signOutAction}>
              <button className="inline-flex min-h-10 shrink-0 items-center gap-2 border border-transparent px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-red-300/60 hover:bg-red-500/15 hover:text-white" type="submit">
                <LogOut aria-hidden="true" size={16} />
                <span>Sair</span>
              </button>
            </form>
          </nav>
        </div>
      </div>
    </header>
  );
}
