import { requireActiveCompanyPlan } from "@/lib/companies/plan-access";

export default async function ProtectedCompanyLayout({ children }: { children: React.ReactNode }) {
  await requireActiveCompanyPlan();
  return children;
}
