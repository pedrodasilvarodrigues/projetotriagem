import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/shell";
import { ProviderSearch, type ProviderSearchParams } from "@/components/marketplace/provider-search";
import { isMarketplaceEnabled } from "@/lib/features";

export const dynamic = "force-dynamic";

export default async function ProfessionalProvidersPage({
  searchParams
}: {
  searchParams: Promise<ProviderSearchParams>;
}) {
  if (!await isMarketplaceEnabled()) redirect("/professional/profile");
  const params = await searchParams;

  return (
    <AppShell eyebrow="Profissional" title="Buscar prestadores">
      <ProviderSearch params={params} basePath="/professional/providers" />
    </AppShell>
  );
}
