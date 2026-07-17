import { Power, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { updateMarketplaceFeatureAction } from "@/lib/actions/system-settings";
import { isMarketplaceEnabled } from "@/lib/features";

const settings = [
  ["Termos de Uso", "Texto jurídico e aceite dos usuários"],
  ["Política de Privacidade", "Comunicação de tratamento de dados"],
  ["LGPD", "Solicitações, exportação e retenção"],
  ["E-mails automáticos", "Modelos transacionais e notificações"],
  ["Categorias profissionais", "Agrupamento de cargos e perfis"],
  ["Áreas de atuação", "Segmentos operacionais da plataforma"],
  ["Parâmetros do sistema", "Regras gerais de triagem e apresentação"]
];

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  const marketplaceEnabled = await isMarketplaceEnabled();

  return (
    <AppShell eyebrow="Administrador" title="Configurações">
      {params.message ? <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Configuração atualizada com sucesso.</p> : null}
      {params.error ? <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">Não foi possível atualizar: {decodeURIComponent(params.error)}</p> : null}

      <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex gap-4">
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${marketplaceEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              <Power size={24} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#0F2D4E]">Prestadores de serviços</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Controle global do marketplace. Ao desativar, menus, buscas, perfis, conversas, avaliações e operações de serviços ficam indisponíveis para todos.</p>
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${marketplaceEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{marketplaceEnabled ? "Ativo" : "Desativado"}</span>
            </div>
          </div>
          <form action={updateMarketplaceFeatureAction}>
            <label className="flex min-w-56 cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-[#0F2D4E]">
              <span>{marketplaceEnabled ? "Desativar módulo" : "Ativar módulo"}</span>
              <input type="checkbox" name="enabled" defaultChecked={marketplaceEnabled} className="size-5 accent-[#F2811D]" />
            </label>
            <button className="mt-3 w-full rounded-xl bg-[#0F2D4E] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#173f6b]">Salvar configuração</button>
          </form>
        </div>
        <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-600 sm:px-6"><ShieldCheck size={16} />A configuração também é aplicada pelas políticas de segurança do banco.</div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0F2D4E]">Configurações globais</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {settings.map(([title, description]) => <article key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-slate-600">{description}</p><span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">Configuração operacional</span></article>)}
        </div>
      </section>
    </AppShell>
  );
}
