import { AppShell } from "@/components/app/shell";
import { CompanyProfileForm } from "@/components/company/company-profile-form";
import { updateCompanyProfileAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

export default async function CompanyProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: company } = await supabase.from("companies").select("id,legal_name,trade_name,cnpj,corporate_email,phone,city,state,status,segment,description").eq("owner_id", userData.user?.id).maybeSingle();
  const { data: contact } = company?.id
    ? await supabase.from("company_contacts").select("name,role_title,phone").eq("company_id", company.id).order("created_at", { ascending: true }).limit(1).maybeSingle()
    : { data: null };

  return (
    <AppShell eyebrow="Empresa" title="Perfil da Empresa">
      {params.error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Verifique os dados informados.</p> : null}
      {params.message ? <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">Empresa atualizada.</p> : null}
      <CompanyProfileForm action={updateCompanyProfileAction} company={company} contact={contact} />
    </AppShell>
  );
}
