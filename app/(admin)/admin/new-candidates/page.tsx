import { AppShell } from "@/components/app/shell";
import { updateProfessionalStatusAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminNewCandidatesPage() {
  const supabase = await createServerClient();
  const { data: candidates } = await supabase.from("professionals").select("id,full_name,desired_role,city,state,created_at").eq("status", "pending").order("created_at", { ascending: false });

  return (
    <AppShell eyebrow="Administrador" title="Novos candidatos">
      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
        <table className="data-table">
          <thead><tr><th>Nome</th><th>Cargo desejado</th><th>Cidade</th><th>Acoes</th></tr></thead>
          <tbody>
            {(candidates ?? []).map((candidate) => (
              <tr key={candidate.id}>
                <td>{candidate.full_name}</td><td>{candidate.desired_role}</td><td>{candidate.city}/{candidate.state}</td>
                <td className="flex gap-2">
                  <form action={updateProfessionalStatusAction}><input type="hidden" name="professionalId" value={candidate.id} /><input type="hidden" name="status" value="approved" /><button className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white">Aprovar</button></form>
                  <form action={updateProfessionalStatusAction}><input type="hidden" name="professionalId" value={candidate.id} /><input type="hidden" name="status" value="rejected" /><button className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white">Reprovar</button></form>
                </td>
              </tr>
            ))}
            {(candidates ?? []).length === 0 ? <tr><td colSpan={4}>Nenhum candidato novo.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
