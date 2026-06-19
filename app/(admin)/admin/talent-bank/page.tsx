import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminTalentBankPage({ searchParams }: { searchParams: Promise<{ q?: string; city?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  let query = supabase.from("professionals").select("id,full_name,desired_role,education_level,city,state,available_in_days,status").order("updated_at", { ascending: false }).limit(50);
  if (params.city) query = query.ilike("city", `%${params.city}%`);
  if (params.q) query = query.or(`full_name.ilike.%${params.q}%,desired_role.ilike.%${params.q}%`);
  const { data: professionals } = await query;

  return (
    <AppShell eyebrow="Administrador" title="Banco de Talentos">
      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
        <form className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <input name="q" defaultValue={params.q ?? ""} placeholder="Nome, cargo, habilidade" className="field-input" />
          <input name="city" defaultValue={params.city ?? ""} placeholder="Cidade" className="field-input" />
          <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Pesquisar</button>
        </form>
        <table className="data-table">
          <thead><tr><th>Profissional</th><th>Cargo</th><th>Escolaridade</th><th>Cidade</th><th>Disponibilidade</th><th>Status</th></tr></thead>
          <tbody>
            {(professionals ?? []).map((item) => <tr key={item.id}><td>{item.full_name}</td><td>{item.desired_role}</td><td>{item.education_level}</td><td>{item.city}/{item.state}</td><td>{item.available_in_days} dias</td><td>{item.status}</td></tr>)}
            {(professionals ?? []).length === 0 ? <tr><td colSpan={6}>Nenhum profissional encontrado.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
