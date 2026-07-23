"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { deleteProfessionalResumeItemAction } from "@/lib/actions/workspace";

type ResumeItemType = "education" | "experience" | "course" | "language" | "skill";

function RemoveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
      aria-label={`Excluir ${label}`}
    >
      <Trash2 aria-hidden="true" size={14} />
      {pending ? "Excluindo..." : "Excluir"}
    </button>
  );
}

export function RemoveResumeItemButton({
  itemId,
  itemType,
  label
}: {
  itemId: string;
  itemType: ResumeItemType;
  label: string;
}) {
  return (
    <form
      action={deleteProfessionalResumeItemAction}
      onSubmit={(event) => {
        if (!window.confirm(`Excluir “${label}” do currículo? Esta ação não pode ser desfeita.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="itemType" value={itemType} />
      <RemoveButton label={label} />
    </form>
  );
}
