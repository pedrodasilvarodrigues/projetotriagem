import { redirect } from "next/navigation";

export default function AdminNewCandidatesPage() {
  redirect("/admin/professionals?status=pending");
}
