import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

type Candidate = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  desired_role: string | null;
  education_level: string | null;
};

type Demand = {
  id: string;
  name: string | null;
  title: string;
  status: string;
};

type CandidateProcess = {
  id: string;
  status: string;
  updated_at: string;
  professional: Candidate | Candidate[] | null;
  demand: Demand | Demand[] | null;
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function processStatusLabel(status: string) {
  const labels: Record<string, string> = {
    received: "Recebido",
    analysis: "Em análise",
    screening: "Triagem",
    pre_approved: "Pre-aprovado",
    training: "Treinamento",
    interview: "Entrevista",
    forwarded: "Apresentado",
    hired: "Contratado",
    rejected: "Não selecionado"
  };
  return labels[status] ?? status;
}

export default async function CompanyCandidatesPage() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: company } = await supabase.from("companies").select("id").eq("owner_id", userData.user?.id).maybeSingle();
  const { data: candidateProcesses } = company?.id
    ? await supabase
        .from("screening_processes")
        .select("id,status,updated_at,demand:demands!inner(id,name,title,status,company_id),professional:professionals!inner(id,full_name,email,phone,city,state,desired_role,education_level)")
        .eq("demand.company_id", company.id)
        .neq("status", "waiting")
        .order("updated_at", { ascending: false })
    : { data: [] };

  const processes = (candidateProcesses ?? []) as unknown as CandidateProcess[];

  return (
    <AppShell eyebrow="Empresa" title="Candidatos apresentados">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="mb-4 text-sm leading-6 text-slate-600">
          Aqui aparecem somente os profissionais que o administrador apresentou para demandas da sua empresa. Candidatos mantidos na fila reserva não ficam visiveis.
        </p>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Candidato</th><th>Contato</th><th>Demanda</th><th>Perfil</th><th>Situação</th><th>Atualizado em</th></tr>
            </thead>
            <tbody>
              {processes.map((process) => {
                const candidate = one(process.professional);
                const demand = one(process.demand);
                if (!candidate || !demand) return null;
                return (
                  <tr key={process.id}>
                    <td><strong>{candidate.full_name}</strong><br /><span className="text-xs text-slate-500">{candidate.city ?? "-"}/{candidate.state ?? "-"}</span></td>
                    <td>{candidate.email ?? "Email não informado"}<br /><span className="text-xs text-slate-500">{candidate.phone ?? "Telefone não informado"}</span></td>
                    <td><strong>{demand.name ?? demand.title}</strong><br /><span className="text-xs text-slate-500">{demand.title}</span></td>
                    <td>{candidate.desired_role ?? "Objetivo não informado"}<br /><span className="text-xs text-slate-500">Escolaridade: {candidate.education_level ?? "-"}</span></td>
                    <td><span className="inline-flex rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">{processStatusLabel(process.status)}</span></td>
                    <td>{new Date(process.updated_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                );
              })}
              {processes.length === 0 ? <tr><td colSpan={6}>Nenhum candidato foi apresentado para sua empresa ainda.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
