import Link from "next/link";
import { AppShell } from "@/components/app/shell";

const sections = [
  ["Profissionais", "Gerenciar cadastro, curriculo, status, historico e apresentacoes para empresas.", "/admin/professionals"],
  ["Empresas", "Acompanhar empresas, demandas abertas e profissionais apresentados.", "/admin/companies"],
  ["Demandas", "Criar, editar, encerrar, reabrir e arquivar demandas.", "/admin/demands"],
  ["Processos", "Controlar triagem, apresentacao, entrevista, resultados e contratacoes.", "/admin/processes"],
  ["Cursos", "Modulo institucional em desenvolvimento.", "/admin/courses"],
  ["Relatorios", "Consultar indicadores administrativos simples.", "/admin/reports"],
  ["Configuracoes", "Parametros globais, LGPD, emails e categorias.", "/admin/settings"]
] as const;

export default function AdminHomePage() {
  return (
    <AppShell eyebrow="Administrador" title="Area Administrativa">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Controle operacional do Portal de Triagem Profissional. Use os menus abaixo para gerenciar profissionais, empresas, demandas e processos sem depender de um dashboard complexo.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {sections.map(([title, description, href]) => (
            <Link key={href} href={href} className="rounded border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50">
              <h2 className="font-semibold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
