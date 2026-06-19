import { AppShell } from "@/components/app/shell";
import { CompanyProfileForm } from "@/components/company/company-profile-form";
import { ensureCompanyPublicProfile } from "@/lib/auth/public-profile-sync";
import { updateCompanyProfileAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

export default async function CompanyProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (userData.user) await ensureCompanyPublicProfile(userData.user);
  const [{ data: company }, { data: profile }] = await Promise.all([
    supabase.from("companies").select("id,legal_name,trade_name,cnpj,corporate_email,phone,cep,street,address_number,neighborhood,city,state,status,segment,description").eq("owner_id", userData.user?.id).maybeSingle(),
    supabase.from("profiles").select("full_name,email,phone").eq("id", userData.user?.id).maybeSingle()
  ]);
  const { data: contact } = company?.id
    ? await supabase.from("company_contacts").select("name,email,role_title,phone").eq("company_id", company.id).order("created_at", { ascending: true }).limit(1).maybeSingle()
    : { data: null };
  const authEmail = userData.user?.email ?? "";
  const metadataName = String(userData.user?.user_metadata?.full_name ?? userData.user?.user_metadata?.name ?? "").trim();
  const fallbackName = profile?.full_name || metadataName || authEmail.split("@")[0] || "Empresa em configuração";
  const fallbackEmail = company?.corporate_email || profile?.email || authEmail;
  const companyView = {
    ...company,
    legal_name: company?.legal_name || fallbackName,
    trade_name: company?.trade_name || company?.legal_name || fallbackName,
    cnpj: company?.cnpj?.startsWith("PENDENTE-") ? "" : company?.cnpj ?? "",
    corporate_email: fallbackEmail,
    phone: company?.phone || profile?.phone || "",
    cep: company?.cep ?? "",
    street: company?.street ?? "",
    address_number: company?.address_number ?? "",
    neighborhood: company?.neighborhood ?? "",
    city: company?.city ?? "",
    state: company?.state ?? "",
    status: company?.status ?? "pending",
    segment: company?.segment ?? "",
    description: company?.description ?? ""
  };
  const contactView = {
    name: contact?.name || profile?.full_name || metadataName || "",
    email: contact?.email || fallbackEmail,
    role_title: contact?.role_title ?? "",
    phone: contact?.phone || profile?.phone || ""
  };

  return (
    <AppShell eyebrow="Empresa" title="Perfil da Empresa">
      {params.error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Verifique os dados informados.</p> : null}
      {params.message ? <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">Empresa atualizada.</p> : null}
      <CompanyProfileForm action={updateCompanyProfileAction} company={companyView} contact={contactView} />
    </AppShell>
  );
}
