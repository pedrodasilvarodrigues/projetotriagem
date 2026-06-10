import { AppShell } from "@/components/app/shell";
import { updateProfessionalStatusAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminCandidatesPage() {
  const supabase = await createServerClient();
  const { data: candidates } = await supabase.from("professionals").select("id,full_name,desired_role,city,state,status").order("updated_at", { ascending: false }).limit(80);

  return (
    <AppShell eyebrow="Administrador" title="Gestao de Candidatos">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <table className="data-table">
          <thead><tr><th>Nome</th><th>Cargo</th><th>Cidade</th><th>Status</th><th>Alterar status</th></tr></thead>
          <tbody>
            {(candidates ?? []).map((candidate) => (
              <tr key={candidate.id}>
                <td>{candidate.full_name}</td><td>{candidate.desired_role}</td><td>{candidate.city}/{candidate.state}</td><td>{candidate.status}</td>
                <td>
                  <form action={updateProfessionalStatusAction} className="flex gap-2">
                    <input type="hidden" name="professionalId" value={candidate.id} />
                    <select name="status" className="rounded border border-slate-300 px-2 py-1 text-xs">
                      <option value="pending">Novo / Em analise</option>
                      <option value="approved">Aprovado / Reserva</option>
                      <option value="suspended">Bloqueado</option>
                      <option value="rejected">Reprovado</option>
                    </select>
                    <button className="rounded bg-slate-950 px-3 py-1 text-xs font-semibold text-white">Salvar</button>
                  </form>
                </td>
              </tr>
            ))}
            {(candidates ?? []).length === 0 ? <tr><td colSpan={5}>Nenhum candidato cadastrado.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
