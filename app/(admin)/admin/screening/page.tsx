import { redirect } from "next/navigation";

export default function LegacyAdminScreeningPage() {
  redirect("/admin/referrals");
}
