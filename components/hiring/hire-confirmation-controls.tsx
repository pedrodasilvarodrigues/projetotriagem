"use client";

import { BriefcaseBusiness, Check, X } from "lucide-react";
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { companyConfirmHireAction, professionalRespondHireAction } from "@/lib/actions/hiring";

type ConfirmationKind = "company" | "professional-yes" | "professional-no";

const confirmationCopy: Record<ConfirmationKind, { title: string; text: string; confirm: string; loading: string }> = {
  company: {
    title: "Confirmar contratação?",
    text: "O profissional receberá uma solicitação para confirmar. A contratação só será oficial quando os dois lados concordarem.",
    confirm: "Sim, contratei",
    loading: "Enviando confirmação..."
  },
  "professional-yes": {
    title: "Você confirma a contratação?",
    text: "Ao confirmar, o processo será concluído oficialmente como contratado.",
    confirm: "Sim, fui contratado",
    loading: "Confirmando..."
  },
  "professional-no": {
    title: "Você não foi contratado?",
    text: "A divergência será encaminhada ao Admin para análise. Nenhuma contratação será registrada automaticamente.",
    confirm: "Não, não fui contratado",
    loading: "Registrando resposta..."
  }
};

function SubmitButton({ kind }: { kind: ConfirmationKind }) {
  const { pending } = useFormStatus();
  const copy = confirmationCopy[kind];
  const Icon = kind === "company" ? BriefcaseBusiness : kind === "professional-yes" ? Check : X;
  const tone = kind === "professional-no"
    ? "border border-slate-300 bg-white text-[#0F2D4E] hover:border-red-300 hover:bg-red-50 hover:text-red-800"
    : kind === "company"
      ? "bg-[#0F2D4E] text-white shadow-[0_10px_24px_rgba(15,45,78,.18)] hover:-translate-y-0.5 hover:bg-[#173D65]"
      : "bg-[#F2811D] text-[#071522] shadow-[0_10px_24px_rgba(242,129,29,.22)] hover:-translate-y-0.5 hover:bg-[#F5A24D]";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2811D] focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-wait disabled:opacity-60 ${tone}`}
    >
      <Icon aria-hidden="true" size={17} />
      {pending ? copy.loading : copy.confirm}
    </button>
  );
}

function ConfirmationForm({ processId, kind }: { processId: string; kind: ConfirmationKind }) {
  const confirmed = useRef(false);
  const copy = confirmationCopy[kind];
  const action = kind === "company" ? companyConfirmHireAction : professionalRespondHireAction;

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
          title: copy.title,
          text: copy.text,
          icon: kind === "professional-no" ? "warning" : "question",
          iconColor: "#F2811D",
          showCancelButton: true,
          confirmButtonText: copy.confirm,
          cancelButtonText: "Voltar",
          reverseButtons: true,
          focusCancel: true,
          allowOutsideClick: false,
          customClass: {
            popup: "rounded-2xl",
            title: "text-[#0F2D4E]",
            htmlContainer: "text-slate-600",
            actions: "gap-2",
            confirmButton: "rounded-xl bg-[#0F2D4E] px-5 py-2.5 font-semibold text-white hover:bg-[#173D65] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2811D] focus-visible:ring-offset-2",
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
      {kind !== "company" ? <input type="hidden" name="response" value={kind === "professional-yes" ? "yes" : "no"} /> : null}
      <SubmitButton kind={kind} />
    </form>
  );
}

export function CompanyHireButton({ processId }: { processId: string }) {
  return <ConfirmationForm processId={processId} kind="company" />;
}

export function ProfessionalHireResponse({ processId }: { processId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ConfirmationForm processId={processId} kind="professional-yes" />
      <ConfirmationForm processId={processId} kind="professional-no" />
    </div>
  );
}
