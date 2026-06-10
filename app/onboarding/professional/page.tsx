import { OnboardingLayout } from "@/components/auth/onboarding-layout";
import { ProfessionalOnboardingForm } from "@/components/auth/professional-onboarding-form";
import { createServerClient } from "@/lib/supabase/server";

export default async function ProfessionalOnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();

  return (
    <OnboardingLayout title="Cadastro profissional" description="Informe seus dados essenciais para iniciar sua triagem e preparar seu cadastro no banco de talentos.">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ProfessionalOnboardingForm email={data.user?.email ?? ""} error={params.error} />
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Depois do cadastro</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Voce entrara direto na sua area. O curriculo pode ser enviado depois pelo menu Curriculo.</p>
        </aside>
      </div>
    </OnboardingLayout>
  );
}
