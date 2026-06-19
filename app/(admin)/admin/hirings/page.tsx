import { redirect } from "next/navigation";

export default function AdminHiringsPage() {
  redirect("/admin/processes?status=hired");
}
