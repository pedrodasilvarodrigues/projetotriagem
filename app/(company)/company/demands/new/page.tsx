import { AppShell } from "@/components/app/shell";
import { CompanyDemandForm } from "@/components/company/company-demand-form";
import { createDemandAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

export default async function NewDemandPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: company } = await supabase.from("companies").select("city,state").eq("owner_id", userData.user?.id).maybeSingle();

  return (
    <AppShell eyebrow="Empresa" title="Criar Demanda">
      {params.error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Não foi possível criar a demanda: {params.error}</p> : null}
      <CompanyDemandForm action={createDemandAction} companyCity={company?.city} companyState={company?.state} submitLabel="Públicar demanda interna" />
    </AppShell>
  );
}
