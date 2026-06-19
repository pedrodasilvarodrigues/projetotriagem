import { AppShell } from "@/components/app/shell";

const settings = [
  ["Termos de Uso", "Texto juridico e aceite dos usuarios"],
  ["Politica de Privacidade", "Comunicacao de tratamento de dados"],
  ["LGPD", "Solicitacoes, exportacao e retencao"],
  ["Emails automaticos", "Modelos transacionais e notificacoes"],
  ["Categorias profissionais", "Agrupamento de cargos e perfis"],
  ["Areas de atuacao", "Segmentos operacionais da plataforma"],
  ["Parametros do sistema", "Regras gerais de triagem e apresentacao"]
];

export default function AdminSettingsPage() {
  return (
    <AppShell eyebrow="Administrador" title="Configuracoes">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Configuracoes globais</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Area preparada para centralizar politicas, parametros e cadastros auxiliares do portal.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {settings.map(([title, description]) => (
            <article key={title} className="rounded border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{description}</p>
              <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">Configuracao operacional</span>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
