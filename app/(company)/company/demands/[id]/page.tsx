import { AppShell } from "@/components/app/shell";
import { CompanyDemandForm } from "@/components/company/company-demand-form";
import { closeDemandAction, deleteDemandAction, updateDemandAction } from "@/lib/actions/workspace";
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

  if (!demand) {
    return (
      <AppShell eyebrow="Empresa" title="Editar Demanda">
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">Demanda não encontrada para está empresa.</p>
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
          submitLabel="Salvar alteracoes"
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

        {!['closed', 'cancelled'].includes(demand.status) ? (
          <form action={closeDemandAction} className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
            <input type="hidden" name="demandId" value={demand.id} />
            <input type="hidden" name="redirectTo" value={`/company/demands/${demand.id}`} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Encerrar demanda</h2>
                <p className="mt-1 text-sm text-slate-600">Use está opção quando a vaga já tiver sido preenchida. A demanda deixa de receber novos candidatos.</p>
              </div>
              <button className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white" type="submit">Encerrar demanda</button>
            </div>
          </form>
        ) : null}

        <form action={deleteDemandAction} className="rounded-lg border border-red-200 bg-red-50 p-5 shadow-sm">
          <input type="hidden" name="demandId" value={demand.id} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-red-900">Excluir demanda</h2>
              <p className="mt-1 text-sm text-red-800">A demanda será marcada como cancelada e deixara de aparecer como ativa.</p>
            </div>
            <button className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white" type="submit">Excluir demanda</button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
