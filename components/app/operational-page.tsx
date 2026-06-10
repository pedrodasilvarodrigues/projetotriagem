import { CheckCircle2, Clock3, Filter, Plus, Search } from "lucide-react";

export type TableColumn = {
  key: string;
  label: string;
};

export type TableRow = Record<string, string | number>;

export type Metric = {
  label: string;
  value: string;
  detail: string;
};

export type QuickAction = {
  label: string;
  tone?: "primary" | "neutral" | "danger";
};

function toneClass(tone: QuickAction["tone"]) {
  if (tone === "danger") return "border-red-500 text-red-600";
  if (tone === "primary") return "border-blue-600 bg-blue-600 text-white";
  return "border-[var(--border)] text-[var(--text)]";
}

export function OperationalPage({
  description,
  metrics,
  actions,
  columns,
  rows,
  formTitle,
  formFields,
  timeline
}: {
  description: string;
  metrics: Metric[];
  actions: QuickAction[];
  columns: TableColumn[];
  rows: TableRow[];
  formTitle: string;
  formFields: string[];
  timeline: string[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button key={action.label} className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${toneClass(action.tone)}`} type="button">
              {action.tone === "primary" ? <Plus aria-hidden="true" size={16} /> : <CheckCircle2 aria-hidden="true" size={16} />}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-sm text-[var(--muted)]">{metric.label}</p>
            <strong className="mt-2 block text-2xl font-semibold tracking-normal">{metric.value}</strong>
            <p className="mt-2 text-xs text-[var(--muted)]">{metric.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
            <div className="relative min-w-64 flex-1">
              <Search aria-hidden="true" className="absolute left-3 top-2.5 text-[var(--muted)]" size={16} />
              <input aria-label="Buscar registros" className="w-full rounded-md border border-[var(--border)] bg-transparent py-2 pl-9 pr-3 text-sm" />
            </div>
            <button className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm" type="button">
              <Filter aria-hidden="true" size={16} />
              Filtros
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--muted)]">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="px-4 py-3 font-semibold">{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row[columns[0].key]}-${index}`} className="border-b border-[var(--border)] last:border-0">
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3">{row[column.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="text-base font-semibold">{formTitle}</h2>
            <form className="mt-4 space-y-3">
              {formFields.map((field) => (
                <label key={field} className="block text-sm font-medium">
                  {field}
                  <input className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm" />
                </label>
              ))}
              <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white" type="button">
                Salvar
              </button>
            </form>
          </section>
          <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="text-base font-semibold">Linha do tempo</h2>
            <ol className="mt-4 space-y-3">
              {timeline.map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <Clock3 aria-hidden="true" className="mt-0.5 text-[var(--muted)]" size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
