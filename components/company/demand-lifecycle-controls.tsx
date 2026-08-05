"use client";

import { Archive, Trash2 } from "lucide-react";
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { closeDemandAction, deleteDemandAction } from "@/lib/actions/workspace";

type DemandAction = "archive" | "delete";

const copy = {
  archive: {
    title: "Arquivar demanda?",
    text: "A demanda deixará de receber novos candidatos, mas todo o histórico será preservado.",
    confirm: "Arquivar",
    loading: "Arquivando..."
  },
  delete: {
    title: "Excluir demanda?",
    text: "A demanda será removida da lista. Esta opção só é permitida quando nenhuma contratação foi registrada.",
    confirm: "Excluir demanda",
    loading: "Excluindo..."
  }
} satisfies Record<DemandAction, { title: string; text: string; confirm: string; loading: string }>;

function SubmitButton({ kind, compact }: { kind: DemandAction; compact: boolean }) {
  const { pending } = useFormStatus();
  const Icon = kind === "archive" ? Archive : Trash2;
  const label = kind === "archive" ? "Arquivar" : "Excluir";
  const tone = kind === "archive"
    ? "border-[#0F2D4E]/20 bg-white text-[#0F2D4E] hover:border-[#F2811D] hover:bg-orange-50"
    : "border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2811D] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"} ${tone}`}
    >
      <Icon aria-hidden="true" size={compact ? 15 : 17} />
      {pending ? copy[kind].loading : label}
    </button>
  );
}

function DemandActionForm({ demandId, redirectTo, kind, compact }: { demandId: string; redirectTo: string; kind: DemandAction; compact: boolean }) {
  const confirmed = useRef(false);
  const action = kind === "archive" ? closeDemandAction : deleteDemandAction;

  return (
    <form
      action={action}
      onSubmit={async (event) => {
        if (confirmed.current) {
          confirmed.current = false;
          return;
        }

        event.preventDefault();
        const form = event.currentTarget;
        const result = await Swal.fire({
          title: copy[kind].title,
          text: copy[kind].text,
          icon: kind === "delete" ? "warning" : "question",
          iconColor: kind === "delete" ? "#B42318" : "#F2811D",
          showCancelButton: true,
          confirmButtonText: copy[kind].confirm,
          cancelButtonText: "Cancelar",
          reverseButtons: true,
          focusCancel: true,
          allowOutsideClick: false,
          customClass: {
            popup: "rounded-2xl",
            title: "text-[#0F2D4E]",
            htmlContainer: "text-slate-600",
            actions: "gap-2",
            confirmButton: `rounded-xl px-5 py-2.5 font-semibold text-white ${kind === "delete" ? "bg-red-700 hover:bg-red-800" : "bg-[#0F2D4E] hover:bg-[#173D65]"}`,
            cancelButton: "rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-[#0F2D4E] hover:bg-slate-50"
          },
          buttonsStyling: false
        });

        if (result.isConfirmed) {
          confirmed.current = true;
          form.requestSubmit();
        }
      }}
    >
      <input type="hidden" name="demandId" value={demandId} />
      {kind === "archive" ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
      <SubmitButton kind={kind} compact={compact} />
    </form>
  );
}

export function DemandLifecycleControls({
  demandId,
  status,
  hasHiredProfessional,
  redirectTo,
  compact = false
}: {
  demandId: string;
  status: string;
  hasHiredProfessional: boolean;
  redirectTo: string;
  compact?: boolean;
}) {
  const archived = ["closed", "cancelled"].includes(status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!archived ? <DemandActionForm demandId={demandId} redirectTo={redirectTo} kind="archive" compact={compact} /> : null}
      {!hasHiredProfessional ? <DemandActionForm demandId={demandId} redirectTo={redirectTo} kind="delete" compact={compact} /> : null}
    </div>
  );
}
