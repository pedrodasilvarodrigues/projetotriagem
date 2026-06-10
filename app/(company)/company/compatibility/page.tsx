import { redirect } from "next/navigation";

export default function LegacyCompanyCompatibilityPage() {
  redirect("/company/candidates");
}
