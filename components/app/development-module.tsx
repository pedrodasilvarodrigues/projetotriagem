import { Construction } from "lucide-react";

export function DevelopmentModule({ moduleName, description }: { moduleName: string; description?: string }) {
  return (
    <section className="overflow-hidden rounded-lg border border-amber-200 bg-white shadow-sm">
      <div className="grid gap-5 p-6 md:grid-cols-[120px_minmax(0,1fr)] md:items-center">
        <div className="flex size-24 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Construction aria-hidden="true" size={44} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">{moduleName}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Modulo em Desenvolvimento</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            {description ?? "Estamos trabalhando nesta funcionalidade. Em breve sera possivel gerenciar cursos, categorias e instituicoes diretamente pela plataforma."}
          </p>
          <p className="mt-4 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Previsao interna: proxima etapa do produto</p>
        </div>
      </div>
    </section>
  );
}
