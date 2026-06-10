import { AppShell } from "@/components/app/shell";
import { updateCompanyProfileAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

export default async function CompanyProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: company } = await supabase.from("companies").select("legal_name,trade_name,corporate_email,phone,city,state,status,segment,description").eq("owner_id", userData.user?.id).maybeSingle();

  return (
    <AppShell eyebrow="Empresa" title="Perfil da Empresa">
      <form action={updateCompanyProfileAction} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        {params.error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Verifique os dados informados.</p> : null}
        {params.message ? <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">Empresa atualizada.</p> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">Razao social<input name="legalName" required defaultValue={company?.legal_name ?? ""} className="field-input mt-2" /></label>
          <label className="text-sm font-semibold">Nome fantasia<input name="tradeName" required defaultValue={company?.trade_name ?? ""} className="field-input mt-2" /></label>
          <label className="text-sm font-semibold">Email corporativo<input name="corporateEmail" required type="email" defaultValue={company?.corporate_email ?? ""} className="field-input mt-2" /></label>
          <label className="text-sm font-semibold">Telefone<input name="phone" required defaultValue={company?.phone ?? ""} className="field-input mt-2" /></label>
          <label className="text-sm font-semibold">Segmento<input name="segment" required defaultValue={company?.segment ?? ""} className="field-input mt-2" /></label>
          <label className="text-sm font-semibold">Cidade<input name="city" required defaultValue={company?.city ?? ""} className="field-input mt-2" /></label>
          <label className="text-sm font-semibold">Estado<input name="state" required maxLength={2} defaultValue={company?.state ?? ""} className="field-input mt-2" /></label>
          <label className="text-sm font-semibold md:col-span-2">Descricao<textarea name="description" defaultValue={company?.description ?? ""} className="field-input mt-2 min-h-28" /></label>
        </div>
        <p className="mt-4 text-sm text-slate-500">Status: {company?.status ?? "pending"}</p>
        <button className="mt-5 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white" type="submit">Salvar empresa</button>
      </form>
    </AppShell>
  );
}
