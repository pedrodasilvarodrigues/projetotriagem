"use client";

import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { setCompanyCandidateVisibilityAction } from "@/lib/actions/hiring";

type CandidateVisibility = "active" | "archived" | "removed";

const actionCopy: Record<CandidateVisibility, { title: string; text: string; confirm: string; loading: string }> = {
  active: {
    title: "Restaurar candidato?",
    text: "O candidato voltará para a sua lista principal.",
    confirm: "Restaurar",
    loading: "Restaurando..."
  },
  archived: {
    title: "Arquivar candidato?",
    text: "O candidato sairá da lista principal e continuará disponível na área de arquivados.",
    confirm: "Arquivar",
    loading: "Arquivando..."
  },
  removed: {
    title: "Excluir candidato da lista?",
    text: "Ele deixará de aparecer para a Empresa. O histórico da seleção continuará protegido para auditoria.",
    confirm: "Excluir da lista",
    loading: "Excluindo..."
  }
};

function VisibilitySubmitButton({ target }: { target: CandidateVisibility }) {
  const { pending } = useFormStatus();
  const Icon = target === "active" ? ArchiveRestore : target === "archived" ? Archive : Trash2;
  const label = target === "active" ? "Restaurar" : target === "archived" ? "Arquivar" : "Excluir da lista";
  const tone = target === "removed"
    ? "border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50"
    : "border-[#0F2D4E]/20 bg-white text-[#0F2D4E] hover:border-[#F2811D] hover:bg-orange-50";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2811D] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${tone}`}
    >
      <Icon aria-hidden="true" size={17} />
      {pending ? actionCopy[target].loading : label}
    </button>
  );
}

function VisibilityForm({ processId, target, currentView }: { processId: string; target: CandidateVisibility; currentView: "active" | "archived" }) {
  const confirmed = useRef(false);
  const copy = actionCopy[target];

  return (
    <form
      action={setCompanyCandidateVisibilityAction}
      onSubmit={async (event) => {
        if (confirmed.current) {
          confirmed.current = false;
          return;
        }

        event.preventDefault();
        const form = event.currentTarget;
        const result = await Swal.fire({
          title: copy.title,
          text: copy.text,
          icon: target === "removed" ? "warning" : "question",
          iconColor: target === "removed" ? "#B42318" : "#F2811D",
          showCancelButton: true,
          confirmButtonText: copy.confirm,
          cancelButtonText: "Cancelar",
          reverseButtons: true,
          focusCancel: true,
          allowOutsideClick: false,
          customClass: {
            popup: "rounded-2xl",
            title: "text-[#0F2D4E]",
            htmlContainer: "text-slate-600",
            actions: "gap-2",
            confirmButton: `rounded-xl px-5 py-2.5 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${target === "removed" ? "bg-red-700 hover:bg-red-800 focus-visible:ring-red-700" : "bg-[#0F2D4E] hover:bg-[#173D65] focus-visible:ring-[#F2811D]"}`,
            cancelButton: "rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-[#0F2D4E] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F2D4E] focus-visible:ring-offset-2"
          },
          buttonsStyling: false
        });

        if (result.isConfirmed) {
          confirmed.current = true;
          form.requestSubmit();
        }
      }}
    >
      <input type="hidden" name="processId" value={processId} />
      <input type="hidden" name="targetVisibility" value={target} />
      <input type="hidden" name="currentView" value={currentView} />
      <VisibilitySubmitButton target={target} />
    </form>
  );
}

export function CandidateVisibilityControls({
  processId,
  currentView,
  processStatus
}: {
  processId: string;
  currentView: "active" | "archived";
  processStatus: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <VisibilityForm processId={processId} target={currentView === "archived" ? "active" : "archived"} currentView={currentView} />
      {processStatus !== "hired" ? <VisibilityForm processId={processId} target="removed" currentView={currentView} /> : null}
    </div>
  );
}
