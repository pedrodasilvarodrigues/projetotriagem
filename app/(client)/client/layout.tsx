import { redirect } from "next/navigation";
import { isMarketplaceEnabled } from "@/lib/features";

export default async function ClientAreaLayout({ children }: { children: React.ReactNode }) {
  if (!await isMarketplaceEnabled()) redirect("/");
  return children;
}
