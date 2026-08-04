"use client";

import { useRef } from "react";
import Swal from "sweetalert2";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { changeCompanyPlanAction } from "@/lib/actions/company-plans";
import type { CompanyPlan, CompanyPlanCode } from "@/lib/company-plans";

function PlanSubmitButton({ plan, currentPlan }: { plan: CompanyPlan; currentPlan: CompanyPlanCode }) {
  const { pending } = useFormStatus();
  const isCurrent = plan.code === currentPlan;
  if (isCurrent) return <span className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#0F2D4E]/15 bg-[#0F2D4E]/5 px-4 text-sm font-bold text-[#0F2D4E]"><Check aria-hidden="true" size={17} />Plano atual</span>;

  return <button type="submit" disabled={pending} className={["mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition duration-200 motion-reduce:transition-none disabled:cursor-wait disabled:opacity-70", plan.featured ? "bg-[#F2811D] text-white shadow-[0_12px_24px_rgba(242,129,29,0.26)] hover:-translate-y-0.5 hover:bg-[#d96e10]" : "border border-[#0F2D4E] bg-[#0F2D4E] text-white shadow-[0_10px_22px_rgba(15,45,78,0.16)] hover:-translate-y-0.5 hover:bg-[#173d65]"].join(" ")}>
    {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : <ArrowRight aria-hidden="true" size={18} />}{pending ? "Atualizando plano..." : `Escolher ${plan.name}`}
  </button>;
}

export function CompanyPlanSelector({ plan, currentPlan }: { plan: CompanyPlan; currentPlan: CompanyPlanCode }) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  async function confirmPlanChange(event: React.FormEvent<HTMLFormElement>) {
    if (confirmedRef.current || plan.code === currentPlan) return;
    event.preventDefault();
    const result = await Swal.fire({
      title: `Mudar para o plano ${plan.name}?`, text: `Sua empresa passará a utilizar as condições do plano ${plan.name}.`, icon: "question", showCancelButton: true,
      confirmButtonText: "Confirmar mudança", cancelButtonText: "Manter plano atual", reverseButtons: true, focusCancel: true, buttonsStyling: false,
      customClass: { popup: "rounded-2xl border border-slate-200 shadow-2xl", title: "text-[#0F2D4E] font-display text-2xl", htmlContainer: "text-slate-600", confirmButton: "rounded-xl bg-[#F2811D] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#d96e10]", cancelButton: "mr-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-[#0F2D4E] transition hover:bg-slate-50" }
    });
    if (result.isConfirmed) { confirmedRef.current = true; formRef.current?.requestSubmit(); }
  }
  return <form ref={formRef} action={changeCompanyPlanAction} onSubmit={confirmPlanChange}><input type="hidden" name="planCode" value={plan.code} /><input type="hidden" name="returnTo" value="/company/plans" /><PlanSubmitButton plan={plan} currentPlan={currentPlan} /></form>;
}
