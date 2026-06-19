import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";
import { statusLabel } from "@/lib/status-labels";

type ReferralRow = {
  id: string;
  status: string;
  company_result: string | null;
  demand: { title: string; company: { trade_name: string } | { trade_name: string }[] | null } | { title: string; company: { trade_name: string } | { trade_name: string }[] | null }[] | null;
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProfessionalReferralsPage() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: professional } = await supabase.from("professionals").select("id").eq("user_id", userData.user?.id).maybeSingle();
  const { data: referrals } = professional?.id
    ? await supabase.from("screening_processes").select("id,status,company_result,demand:demands(title,company:companies(trade_name))").eq("professional_id", professional.id).in("status", ["pre_approved", "interview", "forwarded", "hired"]).order("updated_at", { ascending: false })
    : { data: [] };

  return (
    <AppShell eyebrow="Profissional" title="Encaminhamentos">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <table className="data-table">
          <thead><tr><th>Empresa</th><th>Oportunidade</th><th>Situação</th><th>Resultado</th></tr></thead>
          <tbody>
            {((referrals ?? []) as unknown as ReferralRow[]).map((referral) => {
              const demand = one(referral.demand);
              const company = one(demand?.company ?? null);
              return <tr key={referral.id}><td>{company?.trade_name ?? "Empresa em validação"}</td><td>{demand?.title ?? "Oportunidade"}</td><td>{statusLabel(referral.status)}</td><td>{referral.company_result ?? "Em andamento"}</td></tr>;
            })}
            {(referrals ?? []).length === 0 ? <tr><td colSpan={4}>Nenhum encaminhamento liberado ainda.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
