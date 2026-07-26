import { AppShell } from "@/components/app/shell";
import { ProviderSearch, type ProviderSearchParams } from "@/components/marketplace/provider-search";

export const dynamic = "force-dynamic";

export default async function ClientProvidersPage({
  searchParams
}: {
  searchParams: Promise<ProviderSearchParams>;
}) {
  const params = await searchParams;

  return (
    <AppShell eyebrow="Cliente" title="Buscar prestadores">
      <ProviderSearch params={params} basePath="/client/providers" />
    </AppShell>
  );
}
