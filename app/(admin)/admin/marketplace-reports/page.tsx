import { AppShell } from "@/components/app/shell";
import { moderateProviderAction, resolveMarketplaceReportAction } from "@/lib/actions/marketplace";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isMarketplaceEnabled } from "@/lib/features";

export const dynamic = "force-dynamic";
export default async function MarketplaceReportsPage() {
  const supabase = await createServerClient();
  if (!await isMarketplaceEnabled()) redirect("/admin/settings?message=marketplace-desativado");
  const { data } = await supabase.from("marketplace_reports").select("*").order("created_at", { ascending: false });
  return <AppShell eyebrow="Administrador" title="Denúncias e moderação"><div className="grid gap-4">{data?.length ? data.map((report) => <article key={report.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><span className="text-xs font-bold uppercase text-red-700">{report.report_type.replaceAll("_", " ")}</span><h2 className="mt-1 font-bold text-[#0F2D4E]">{report.reason}</h2><p className="mt-2 text-sm text-slate-600">{report.description || "Sem detalhes adicionais."}</p></div><span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{report.status}</span></div><p className="mt-3 text-xs text-slate-400">Recebida em {new Date(report.created_at).toLocaleString("pt-BR")}</p><div className="mt-4 flex flex-wrap gap-2"><form action={resolveMarketplaceReportAction}><input type="hidden" name="reportId" value={report.id} /><button name="status" value="resolved" className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white">Resolver</button><button name="status" value="archived" className="ml-2 rounded-xl bg-slate-700 px-4 py-2 text-xs font-bold text-white">Arquivar</button></form>{report.provider_id && <form action={moderateProviderAction}><input type="hidden" name="providerId" value={report.provider_id} /><input type="hidden" name="reason" value={`Suspensão relacionada à denúncia ${report.id}`} /><button name="status" value="suspended" className="rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white">Suspender prestador</button></form>}</div></article>) : <p className="rounded-2xl bg-white p-8 text-center text-slate-500">Nenhuma denúncia registrada.</p>}</div></AppShell>;
}
