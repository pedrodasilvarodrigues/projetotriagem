import { CompanyOnboardingForm } from "@/components/auth/company-onboarding-form";
import { OnboardingLayout } from "@/components/auth/onboarding-layout";
import { createServerClient } from "@/lib/supabase/server";

export default async function CompanyOnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();

  return (
    <OnboardingLayout title="Cadastro empresarial" description="Cadastre os dados da empresa e do responsável para liberar o acompanhamento e a criacao de demandas privadas.">
      <CompanyOnboardingForm email={data.user?.email ?? ""} error={params.error} />
    </OnboardingLayout>
  );
}
