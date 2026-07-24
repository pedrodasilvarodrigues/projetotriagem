import { AppShell } from "@/components/app/shell";
import { ExploreMarketplace, type ExploreSearchParams } from "@/components/marketplace/explore-marketplace";

export const dynamic = "force-dynamic";

export default async function ClientPage({
  searchParams
}: {
  searchParams: Promise<ExploreSearchParams>;
}) {
  const params = await searchParams;

  return (
    <AppShell eyebrow="Cliente" title="Explorar">
      <ExploreMarketplace params={params} basePath="/client" />
    </AppShell>
  );
}
