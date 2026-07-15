import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

const quickActions = [
  ["Gerenciar profissionais", "Buscar, editar, bloquear, arquivar e encaminhar profissionais.", "/admin/professionals"],
  ["Gerenciar empresas", "Acompanhar empresas, status, demandas e profissionais apresentados.", "/admin/companies"],
  ["Gerenciar demandas", "Acompanhar demandas, apresentar candidatos por compatibilidade e controlar fila reserva.", "/admin/demands"],
  ["Acompanhar processos", "Controlar triagem, apresentação, entrevista, resultado e contratação.", "/admin/processes"]
] as const;

function formatCount(value: number | null) {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}

export default async function AdminHomePage() {
  const supabase = await createServerClient();
  const [
    professionals,
    activeProfessionals,
    companies,
    activeCompanies,
    demands,
    openDemands,
    processes,
    activeProcesses,
    presentations,
    hirings
  ] = await Promise.all([
    supabase.from("professionals").select("id", { count: "exact", head: true }),
    supabase.from("professionals").select("id", { count: "exact", head: true }).is("deleted_at", null).in("status", ["approved", "active"]),
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("companies").select("id", { count: "exact", head: true }).is("deleted_at", null).in("status", ["approved", "active"]),
    supabase.from("demands").select("id", { count: "exact", head: true }),
    supabase.from("demands").select("id", { count: "exact", head: true }).in("status", ["active", "screening"]),
    supabase.from("screening_processes").select("id", { count: "exact", head: true }),
    supabase.from("screening_processes").select("id", { count: "exact", head: true }).in("status", ["triagem", "em_analise", "presented", "interview", "screening", "in_analysis"]),
    supabase.from("professional_presentations").select("id", { count: "exact", head: true }),
    supabase.from("screening_processes").select("id", { count: "exact", head: true }).in("status", ["hired", "contratado"])
  ]);

  const cards = [
    {
      title: "Profissionais cadastrados",
      value: professionals.count,
      detail: `${formatCount(activeProfessionals.count)} ativos/aprovados`,
      href: "/admin/professionals"
    },
    {
      title: "Empresas cadastradas",
      value: companies.count,
      detail: `${formatCount(activeCompanies.count)} ativas/aprovadas`,
      href: "/admin/companies"
    },
    {
      title: "Demandas cadastradas",
      value: demands.count,
      detail: `${formatCount(openDemands.count)} abertas ou em triagem`,
      href: "/admin/demands"
    },
    {
      title: "Processos cadastrados",
      value: processes.count,
      detail: `${formatCount(activeProcesses.count)} processos ativos`,
      href: "/admin/processes"
    },
    {
      title: "Apresentacoes realizadas",
      value: presentations.count,
      detail: "Profissionais encaminhados para empresas",
      href: "/admin/demands#apresentar"
    },
    {
      title: "Contratacoes registradas",
      value: hirings.count,
      detail: "Processos finalizados como contratado",
      href: "/admin/processes"
    }
  ];

  return (
    <AppShell eyebrow="Administrador" title="Painel Administrativo">
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Visão rapida da operação do Portal de Triagem Profissional. A ideia aqui e mostrar o essencial: quantos profissionais, empresas, demandas e processos existem, sem transformar a área administrativa em um painel pesado.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.title} href={card.href} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
              <p className="text-xs font-bold uppercase tracking-wide text-[#38506f]">{card.title}</p>
              <strong className="mt-3 block text-3xl font-semibold text-[#18212f]">{formatCount(card.value)}</strong>
              <p className="mt-2 text-sm text-slate-600">{card.detail}</p>
            </Link>
          ))}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Ações principais</h2>
            <p className="mt-1 text-sm text-slate-600">Atalhos para as áreas onde a operação acontece no dia a dia.</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {quickActions.map(([title, description, href]) => (
              <Link key={href} href={href} className="rounded border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50">
                <h3 className="font-semibold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
