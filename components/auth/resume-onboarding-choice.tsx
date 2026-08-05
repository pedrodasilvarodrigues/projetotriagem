"use client";

import { FileText, UploadCloud } from "lucide-react";

export type ResumeChoice = "uploaded" | "none" | "";

export function ResumeOnboardingChoice({ value, onChange }: { value: ResumeChoice; onChange: (value: ResumeChoice) => void }) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-bold text-slate-950">Como você quer começar seu currículo?</legend>
      <p className="text-sm leading-6 text-slate-600">
        Esta escolha é obrigatória. Você pode anexar seu currículo em PDF para preencher automaticamente os campos ou continuar sem um arquivo.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={`cursor-pointer rounded-2xl border p-4 transition ${value === "uploaded" ? "border-orange-500 bg-orange-50 ring-4 ring-orange-100" : "border-slate-200 bg-white hover:border-slate-300"}`}>
          <input className="sr-only" type="radio" name="resumeChoice" value="uploaded" required checked={value === "uploaded"} onChange={() => onChange("uploaded")} />
          <UploadCloud aria-hidden="true" className="text-orange-500" size={24} />
          <span className="mt-3 block font-bold text-slate-950">Anexar currículo</span>
          <span className="mt-1 block text-xs leading-5 text-slate-600">Envie um PDF de até 5 MB. Ele será salvo e importado para a aba Currículo.</span>
        </label>
        <label className={`cursor-pointer rounded-2xl border p-4 transition ${value === "none" ? "border-blue-700 bg-blue-50 ring-4 ring-blue-100" : "border-slate-200 bg-white hover:border-slate-300"}`}>
          <input className="sr-only" type="radio" name="resumeChoice" value="none" required checked={value === "none"} onChange={() => onChange("none")} />
          <FileText aria-hidden="true" className="text-blue-700" size={24} />
          <span className="mt-3 block font-bold text-slate-950">Não tenho currículo</span>
          <span className="mt-1 block text-xs leading-5 text-slate-600">Você poderá preencher as informações diretamente no Portal Encaixe depois.</span>
        </label>
      </div>
      {value === "uploaded" ? (
        <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-bold text-slate-800">
          Selecione seu currículo em PDF
          <input className="mt-3 block w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-950 file:px-3 file:py-2 file:font-semibold file:text-white" name="resume" type="file" accept="application/pdf,.pdf" required />
          <span className="mt-2 block text-xs font-medium text-slate-500">Se o PDF possuir texto legível, formação, experiências, cursos, idiomas e habilidades serão importados automaticamente.</span>
        </label>
      ) : null}
    </fieldset>
  );
}
