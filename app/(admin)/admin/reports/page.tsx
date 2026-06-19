import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminReportsPage() {
  const supabase = await createServerClient();
  const [
    { count: professionals },
    { count: companies },
    { count: openDemands },
    { count: closedDemands },
    { count: activeProcesses },
    { count: finishedProcesses },
    { count: presentations },
    { count: hires }
  ] = await Promise.all([
    supabase.from("professionals").select("id", { count: "exact", head: true }),
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("demands").select("id", { count: "exact", head: true }).in("status", ["active", "screening"]),
    supabase.from("demands").select("id", { count: "exact", head: true }).in("status", ["closed", "cancelled"]),
    supabase.from("screening_processes").select("id", { count: "exact", head: true }).in("status", ["received", "analysis", "screening", "forwarded", "interview"]),
    supabase.from("screening_processes").select("id", { count: "exact", head: true }).in("status", ["hired", "rejected", "waiting"]),
    supabase.from("professional_presentations").select("id", { count: "exact", head: true }),
    supabase.from("screening_processes").select("id", { count: "exact", head: true }).eq("status", "hired")
  ]);

  const rows = [
    ["Profissionais cadastrados", professionals ?? 0],
    ["Empresas cadastradas", companies ?? 0],
    ["Demandas abertas", openDemands ?? 0],
    ["Demandas encerradas", closedDemands ?? 0],
    ["Processos ativos", activeProcesses ?? 0],
    ["Processos concluidos", finishedProcesses ?? 0],
    ["Apresentacoes realizadas", presentations ?? 0],
    ["Contratacoes registradas", hires ?? 0]
  ] as const;

  return (
    <AppShell eyebrow="Administrador" title="Relatórios">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Resumo operacional simples</h2>
        <p className="mt-2 text-sm text-slate-600">Indicadores de controle da operação, sem graficos ou painel complexo.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 p-4">
              <span className="text-sm font-semibold text-slate-700">{label}</span>
              <strong className="text-2xl text-slate-950">{value}</strong>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
