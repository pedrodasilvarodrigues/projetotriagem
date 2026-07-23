"use client";

import { Trash2 } from "lucide-react";
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
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
  const deletionConfirmed = useRef(false);

  return (
    <form
      action={deleteProfessionalResumeItemAction}
      onSubmit={async (event) => {
        if (deletionConfirmed.current) {
          deletionConfirmed.current = false;
          return;
        }

        event.preventDefault();
        const form = event.currentTarget;
        const result = await Swal.fire({
          title: "Excluir item do currículo?",
          text: `“${label}” será removido permanentemente.`,
          icon: "warning",
          iconColor: "#F2811D",
          showCancelButton: true,
          confirmButtonText: "Sim, excluir",
          cancelButtonText: "Cancelar",
          reverseButtons: true,
          focusCancel: true,
          allowOutsideClick: false,
          customClass: {
            popup: "rounded-2xl",
            title: "text-[#0F2D4E]",
            htmlContainer: "text-slate-600",
            actions: "gap-2",
            confirmButton: "rounded-lg bg-red-700 px-5 py-2.5 font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
            cancelButton: "rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-[#0F2D4E] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F2D4E] focus-visible:ring-offset-2"
          },
          buttonsStyling: false
        });

        if (result.isConfirmed) {
          deletionConfirmed.current = true;
          form.requestSubmit();
        }
      }}
    >
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="itemType" value={itemType} />
      <RemoveButton label={label} />
    </form>
  );
}
