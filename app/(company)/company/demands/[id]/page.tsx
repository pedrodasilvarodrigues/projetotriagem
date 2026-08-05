import { AppShell } from "@/components/app/shell";
import { CompanyDemandForm } from "@/components/company/company-demand-form";
import { DemandLifecycleControls } from "@/components/company/demand-lifecycle-controls";
import { updateDemandAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

type DemandPageParams = {
  id: string;
};

export default async function CompanyDemandEditPage({
  params,
  searchParams
}: {
  params: Promise<DemandPageParams>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: company } = await supabase.from("companies").select("id,city,state").eq("owner_id", userData.user?.id).maybeSingle();
  const { data: demand } = company?.id
    ? await supabase
        .from("demands")
        .select("id,name,title,description,openings,education_minimum,city,state,modality,contract_type,technical_skills,required_courses,minimum_experience_months,status")
        .eq("id", id)
        .eq("company_id", company.id)
        .maybeSingle()
    : { data: null };
  const { count: hiredProfessionals } = demand?.id
    ? await supabase.from("screening_processes").select("id", { count: "exact", head: true }).eq("demand_id", demand.id).eq("status", "hired")
    : { count: 0 };
  const hasHiredProfessional = (hiredProfessionals ?? 0) > 0;

  if (!demand) {
    return (
      <AppShell eyebrow="Empresa" title="Editar Demanda">
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Demanda não encontrada para esta empresa.</p>
      </AppShell>
    );
  }

  return (
    <AppShell eyebrow="Empresa" title="Editar Demanda">
      {query.error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Não foi possível salvar: {query.error}</p> : null}
      {query.message ? <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">Demanda atualizada.</p> : null}
      <div className="space-y-5">
        <CompanyDemandForm
          action={updateDemandAction}
          companyCity={company?.city}
          companyState={company?.state}
          submitLabel="Salvar alterações"
          demand={{
            id: demand.id,
            name: demand.name,
            title: demand.title,
            description: demand.description,
            openings: demand.openings,
            educationMinimum: demand.education_minimum,
            city: demand.city,
            state: demand.state,
            modality: demand.modality,
            contractType: demand.contract_type,
            technicalSkills: demand.technical_skills,
            requiredCourses: demand.required_courses,
            minimumExperienceMonths: demand.minimum_experience_months,
            status: demand.status
          }}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,45,78,.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#0F2D4E]">Organizar demanda</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                {hasHiredProfessional
                  ? "Como esta demanda possui uma contratação, ela faz parte do histórico da Empresa e só pode ser arquivada."
                  : "Você pode arquivar a demanda para preservar o histórico ou excluí-la enquanto nenhuma contratação estiver vinculada a ela."}
              </p>
            </div>
            <DemandLifecycleControls demandId={demand.id} status={demand.status} hasHiredProfessional={hasHiredProfessional} redirectTo={`/company/demands/${demand.id}`} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
