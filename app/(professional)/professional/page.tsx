import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/shell";
import { ExploreMarketplace, type ExploreSearchParams } from "@/components/marketplace/explore-marketplace";
import { isMarketplaceEnabled } from "@/lib/features";

export const dynamic = "force-dynamic";

export default async function ProfessionalHomePage({
  searchParams
}: {
  searchParams: Promise<ExploreSearchParams>;
}) {
  const params = await searchParams;
  if (!await isMarketplaceEnabled()) redirect("/professional/profile");

  return (
    <AppShell eyebrow="Profissional" title="Explorar">
      <ExploreMarketplace params={params} basePath="/professional" />
    </AppShell>
  );
}
