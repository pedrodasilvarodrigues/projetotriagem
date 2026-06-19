import { AppShell } from "@/components/app/shell";
import { PersonalDataFields } from "@/components/professional/personal-data-fields";
import { ensureProfessionalPublicProfile } from "@/lib/auth/public-profile-sync";
import { updateProfessionalProfileAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";
import { statusLabel } from "@/lib/status-labels";

type CityOption = { city: string; state: string };

const profileErrorMessages: Record<string, string> = {
  "nome-invalido": "Informe o nome completo.",
  "email-invalido": "Confira o email informado.",
  "cpf-invalido": "Confira o CPF informado.",
  "cpf-ja-cadastrado": "Este CPF já pertence a outro cadastro.",
  "data-invalida": "Informe uma data valida no formato dd/mm/aaaa e idade mínima de 14 anos.",
  "nacionalidade-invalida": "Informe a nacionalidade.",
  "cargo-invalido": "Informe o cargo desejado.",
  "telefone-invalido": "Informe um telefone com DDD.",
  "cep-invalido": "Informe um CEP com 8 digitos.",
  "endereco-invalido": "Confira os dados do endereço.",
  "localizacao-invalida": "Informe cidade e estado.",
  "erro-ao-salvar-perfil": "Não foi possível salvar os dados gerais. Tente novamente.",
  "erro-ao-salvar-profissional": "Não foi possível salvar os dados profissionais. Tente novamente.",
  "perfil-nao-criado": "Não foi possível preparar o perfil profissional. Tente novamente.",
  "perfil-profissional-indisponivel": "O perfil profissional ficou temporariamente indisponível. Atualize a página e tente novamente."
};

export default async function ProfessionalProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (userData.user) await ensureProfessionalPublicProfile(userData.user);
  const [{ data: professional }, { data: profile }, { data: demandCities }] = await Promise.all([
    supabase
      .from("professionals")
      .select("id,full_name,email,cpf,birth_date,nationality,desired_role,city,state,phone,available_in_days,status,cep,street,address_number,neighborhood")
      .eq("user_id", userData.user?.id)
      .maybeSingle(),
    supabase.from("profiles").select("full_name,email,phone,avatar_path,status").eq("id", userData.user?.id).maybeSingle(),
    supabase.from("demands").select("city,state").in("status", ["active", "screening"]).order("state").order("city")
  ]);

  const authEmail = userData.user?.email ?? "";
  const metadataName = String(userData.user?.user_metadata?.full_name ?? userData.user?.user_metadata?.name ?? "").trim();
  const fallbackName = metadataName || profile?.full_name || professional?.full_name || authEmail.split("@")[0] || "";
  const profileData = {
    fullName: professional?.full_name || profile?.full_name || fallbackName,
    email: professional?.email || profile?.email || authEmail,
    phone: professional?.phone || profile?.phone || "",
    cpf: professional?.cpf ?? "",
    birthDate: professional?.birth_date ?? "",
    nationality: professional?.nationality ?? "Brasileira",
    desiredRole: professional?.desired_role ?? "A definir",
    city: professional?.city ?? "",
    state: professional?.state ?? "",
    availableInDays: professional?.available_in_days ?? 0,
    cep: professional?.cep ?? "",
    street: professional?.street ?? "",
    addressNumber: professional?.address_number ?? "",
    neighborhood: professional?.neighborhood ?? "",
    status: professional?.status ?? profile?.status ?? "pending"
  };

  const { data: preferredCities } = professional?.id ? await supabase.from("professional_preferred_cities").select("city,state").eq("professional_id", professional.id) : { data: [] };
  const selectedCities = new Set((preferredCities ?? []).map((item) => `${item.city}|${item.state}`));
  const cityOptionsMap = new Map<string, CityOption>();
  if (profileData.city && profileData.state) cityOptionsMap.set(`${profileData.city}|${profileData.state}`, { city: profileData.city, state: profileData.state });
  for (const item of (demandCities ?? []) as CityOption[]) cityOptionsMap.set(`${item.city}|${item.state}`, item);
  const cityOptions = Array.from(cityOptionsMap.values()).slice(0, 24);
  const { data: avatarUrl } = profile?.avatar_path ? await supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 60 * 60) : { data: null };

  return (
    <AppShell eyebrow="Profissional" title="Perfil">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form action={updateProfessionalProfileAction} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          {params.error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{profileErrorMessages[params.error] ?? "Verifique os dados informados."}</p> : null}
          {params.message ? <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">Perfil atualizado.</p> : null}
          <section className="mb-6 border-b border-slate-200 pb-5">
            <h2 className="font-semibold">Foto do perfil</h2>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {avatarUrl?.signedUrl ? (
                <img src={avatarUrl.signedUrl} alt="Foto do perfil" className="size-24 border border-slate-200 object-cover" />
              ) : (
                <div className="flex size-24 items-center justify-center border border-slate-200 bg-slate-100 text-2xl font-semibold text-slate-500">
                  {(profileData.fullName || "P").slice(0, 1).toUpperCase()}
                </div>
              )}
              <label className="text-sm font-semibold">
                Alterar foto
                <input name="avatar" type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 block w-full rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm" />
                <span className="mt-2 block text-xs font-normal text-slate-500">PNG, JPG ou WEBP até 2 MB.</span>
              </label>
            </div>
          </section>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold">Nome completo<input name="fullName" required defaultValue={profileData.fullName} className="field-input mt-2" /></label>
            <label className="text-sm font-semibold">Email<input name="email" type="email" defaultValue={profileData.email} className="field-input mt-2" /></label>
            <label className="text-sm font-semibold">Nacionalidade<input name="nationality" defaultValue={profileData.nationality} className="field-input mt-2" /></label>
            <label className="text-sm font-semibold">Cargo desejado<input name="desiredRole" required defaultValue={profileData.desiredRole} className="field-input mt-2" /></label>
            <label className="text-sm font-semibold">Disponibilidade em dias<input name="availableInDays" type="number" min="0" defaultValue={profileData.availableInDays} className="field-input mt-2" /></label>
            <PersonalDataFields initial={profileData} />
          </div>
          <section className="mt-6">
            <h2 className="font-semibold">Cidades para receber vagas</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Selecione as cidades onde você quer receber oportunidades. A lista usa as cidades com vagas abertas pelas empresas cadastradas.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {cityOptions.map((option) => {
                const value = `${option.city}|${option.state}`;
                return (
                  <label key={value} className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium">
                    <input name="preferredCity" type="checkbox" value={value} defaultChecked={selectedCities.has(value)} className="size-4" />
                    {option.city}/{option.state}
                  </label>
                );
              })}
              {cityOptions.length === 0 ? <p className="text-sm text-slate-500">Nenhuma cidade com vaga ativa no momento.</p> : null}
            </div>
          </section>
          <button className="mt-5 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white" type="submit">Salvar perfil</button>
        </form>
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Situação cadastral</h2>
          <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm">{statusLabel(profileData.status)}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">Esses dados alimentam o motor de compatibilidade, a triagem e os encaminhamentos.</p>
        </aside>
      </div>
    </AppShell>
  );
}
