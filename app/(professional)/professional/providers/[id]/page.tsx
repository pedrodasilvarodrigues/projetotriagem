import { AppShell } from "@/components/app/shell";
import { ProviderProfileContent } from "@/components/marketplace/provider-profile-content";

export const dynamic = "force-dynamic";

export default async function ProfessionalProviderProfilePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  return <AppShell eyebrow="Profissional" title="Perfil do prestador"><ProviderProfileContent providerId={id} backHref="/professional/providers" returnTo={`/professional/providers/${id}`} error={query.error} /></AppShell>;
}
