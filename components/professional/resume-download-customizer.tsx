"use client";

import { useMemo, useState } from "react";
import { Check, Download, X } from "lucide-react";

type ResumeDownloadCustomizerProps = {
  exportUrl: string;
  hasDocument: boolean;
  showSalaryExpectation: boolean;
};

const templates = [
  { id: "classico", title: "Classico", tone: "bg-[#d8d9d0]", layout: "grid-cols-[44px_1fr]" },
  { id: "editorial", title: "Editorial", tone: "bg-white", layout: "grid-cols-1" },
  { id: "linha", title: "Linha do tempo", tone: "bg-[#d8d9d0]", layout: "grid-cols-[42px_1fr]" }
];

const colors = [
  { id: "cinza", label: "Cinza", value: "#d8d9d0", ring: "#174a86" },
  { id: "azul", label: "Azul", value: "#9fc9f0", ring: "#9fc9f0" },
  { id: "verde", label: "Verde", value: "#afd984", ring: "#afd984" },
  { id: "coral", label: "Coral", value: "#f28486", ring: "#f28486" },
  { id: "laranja", label: "Laranja", value: "#ffa255", ring: "#ffa255" },
  { id: "amarelo", label: "Amarelo", value: "#ffe68a", ring: "#ffe68a" },
  { id: "roxo", label: "Roxo", value: "#b69ded", ring: "#b69ded" }
];

function TemplatePreview({ templateId, color }: { templateId: string; color: string }) {
  const timeline = templateId === "linha";

  return (
    <div className={`h-40 rounded-xl border border-slate-200 p-3 shadow-sm ${templateId === "editorial" ? "bg-white" : "bg-[#f5f6f4]"}`}>
      <div className={`grid h-full gap-3 ${timeline ? "grid-cols-[34px_1fr]" : templateId === "classico" ? "grid-cols-[42px_1fr]" : "grid-cols-1"}`}>
        {(timeline || templateId === "classico") ? (
          <div className="rounded-lg p-2" style={{ backgroundColor: color }}>
            <div className="size-7 rounded-full bg-white/80" />
            <div className="mt-4 h-2 rounded bg-white/80" />
            <div className="mt-2 h-2 w-3/4 rounded bg-white/70" />
          </div>
        ) : null}
        <div className="min-w-0">
          {templateId === "editorial" ? <div className="mb-3 h-8 rounded-lg" style={{ backgroundColor: color }} /> : null}
          <div className="h-2.5 w-2/3 rounded bg-slate-800" />
          <div className="mt-2 h-2 rounded bg-slate-300" />
          <div className="mt-1.5 h-2 w-5/6 rounded bg-slate-300" />
          <div className="mt-5 grid gap-2">
            {[0, 1, 2].map((item) => (
              <div key={item} className="grid grid-cols-[14px_1fr] gap-2">
                <span className="mt-0.5 size-3 rounded-full border-2 border-slate-400 bg-white" />
                <span>
                  <span className="block h-2 w-1/2 rounded bg-slate-800" />
                  <span className="mt-1.5 block h-2 rounded bg-slate-300" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResumeDownloadCustomizer({ exportUrl, hasDocument, showSalaryExpectation }: ResumeDownloadCustomizerProps) {
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState(templates[0].id);
  const [color, setColor] = useState(colors[0].id);
  const [salary, setSalary] = useState(showSalaryExpectation);

  const selectedColor = useMemo(() => colors.find((item) => item.id === color) ?? colors[0], [color]);
  const selectedTemplate = templates.find((item) => item.id === template) ?? templates[0];

  function handleDownload() {
    const url = new URL(exportUrl, window.location.origin);
    url.searchParams.set("template", selectedTemplate.id);
    url.searchParams.set("color", selectedColor.id);
    url.searchParams.set("salary", salary ? "1" : "0");
    window.location.assign(url.toString());
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-[#174a86] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#103765]"
      >
        <Download aria-hidden="true" size={18} />
        Baixar currículo
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 px-3 py-4 backdrop-blur-sm sm:items-center">
          <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[28px] bg-white p-6 text-slate-950 shadow-2xl sm:rounded-[28px] sm:p-7">
            <div className="mx-auto mb-5 h-1.5 w-40 rounded-full bg-slate-200" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-[#174a86]">Currículo</p>
                <h2 className="mt-1 text-2xl font-bold tracking-normal">Personalize seu CV</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" aria-label="Fechar personalização">
                <X aria-hidden="true" size={26} />
              </button>
            </div>

            <p className="mt-5 max-w-2xl text-xl leading-8 text-slate-700">Escolha um dos 3 modelos de visual disponíveis para destacar seu currículo.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {templates.map((item) => {
                const selected = item.id === selectedTemplate.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTemplate(item.id)}
                    className={`rounded-2xl border bg-white p-2 text-left transition ${selected ? "border-[#174a86] shadow-[0_0_0_3px_rgba(23,74,134,0.14)]" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <TemplatePreview templateId={item.id} color={selectedColor.value} />
                    <span className="mt-3 flex items-center justify-between px-1 pb-1 text-sm font-bold">
                      {item.title}
                      {selected ? <Check aria-hidden="true" size={16} className="text-[#174a86]" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-7 text-xl leading-8 text-slate-700">Selecione uma das 7 cores disponíveis para finalizar sua personalização.</p>
            <div className="mt-5 flex flex-wrap gap-4">
              {colors.map((item) => {
                const selected = item.id === selectedColor.id;

                return (
                  <button key={item.id} type="button" onClick={() => setColor(item.id)} className="group grid gap-2 text-center text-sm font-semibold text-slate-600">
                    <span
                      className={`size-14 rounded-full border-4 transition ${selected ? "border-[#174a86] p-1" : "border-transparent group-hover:border-slate-200"}`}
                      style={{ backgroundColor: selected ? "transparent" : item.value }}
                    >
                      <span className="block size-full rounded-full" style={{ backgroundColor: item.value }} />
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <label className="mt-7 flex items-center gap-3 text-base font-bold text-slate-700">
              <input type="checkbox" checked={salary} onChange={(event) => setSalary(event.target.checked)} className="size-6 rounded border-slate-300 text-[#174a86]" />
              Mostrar pretensão salarial
            </label>

            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-950">Resumo da exportação</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Modelo {selectedTemplate.title.toLowerCase()}, cor {selectedColor.label.toLowerCase()} e pretensão salarial {salary ? "visível" : "oculta"}.
                {hasDocument ? " O PDF será recriado com os dados do seu perfil e as escolhas acima." : " O PDF será gerado com os dados preenchidos no currículo."}
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Cancelar</button>
              <button type="button" onClick={handleDownload} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#174a86] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#103765]">
                <Download aria-hidden="true" size={18} />
                Baixar PDF personalizado
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
