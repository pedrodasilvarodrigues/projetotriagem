"use client";

import { useEffect, useMemo, useState } from "react";

type DemandFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  companyCity?: string | null;
  companyState?: string | null;
  submitLabel: string;
  demand?: {
    id: string;
    name?: string | null;
    title: string;
    description: string;
    openings: number;
    educationMinimum: string;
    city: string;
    state: string;
    modality: string;
    contractType: string;
    technicalSkills?: string[] | null;
    requiredCourses?: string[] | null;
    minimumExperienceMonths?: number | null;
    status?: string | null;
  } | null;
};

const automaticEducationRules = [
  { level: "superior", keywords: ["engenheiro", "engenheira", "medico", "medica", "professor", "professora", "advogado", "advogada", "arquiteto", "arquiteta", "dentista", "farmaceutico", "farmaceutica", "psicologo", "psicologa", "contador", "contadora"] },
  { level: "tecnico", keywords: ["tecnico", "técnico", "tecnica", "técnica", "eletrotecnico", "eletrotécnico", "enfermagem"] }
];

function normalize(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function suggestEducationLevel(title: string) {
  const normalized = normalize(title);
  for (const rule of automaticEducationRules) {
    if (rule.keywords.some((keyword) => normalized.includes(normalize(keyword)))) {
      return rule.level;
    }
  }
  return "";
}

export function CompanyDemandForm({ action, companyCity, companyState, submitLabel, demand }: DemandFormProps) {
  const [title, setTitle] = useState(demand?.title ?? "");
  const [educationMinimum, setEducationMinimum] = useState(demand?.educationMinimum ?? "medio");
  const [educationTouched, setEducationTouched] = useState(Boolean(demand?.educationMinimum));

  const defaultCity = demand?.city ?? companyCity ?? "";
  const defaultState = demand?.state ?? companyState ?? "";
  const technicalSkillsValue = useMemo(() => (demand?.technicalSkills ?? []).join(", "), [demand?.technicalSkills]);
  const requiredCoursesValue = useMemo(() => (demand?.requiredCourses ?? []).join(", "), [demand?.requiredCourses]);

  useEffect(() => {
    if (educationTouched) return;
    const suggestion = suggestEducationLevel(title);
    if (suggestion) {
      setEducationMinimum(suggestion);
    }
  }, [educationTouched, title]);

  return (
    <form action={action} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {demand?.id ? <input type="hidden" name="demandId" value={demand.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold md:col-span-2">
          Nome da demanda
          <input name="name" required defaultValue={demand?.name ?? ""} className="field-input mt-2" placeholder="Ex.: Expansao comercial Muriae 2026" />
        </label>
        <label className="text-sm font-semibold md:col-span-2">
          Cargo / título
          <input
            name="title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="field-input mt-2"
            placeholder="Ex.: Engenheiro civil"
          />
        </label>
        <label className="text-sm font-semibold md:col-span-2">
          Descrição
          <textarea name="description" required defaultValue={demand?.description ?? ""} className="field-input mt-2 min-h-28" />
        </label>
        <label className="text-sm font-semibold">
          Quantidade de vagas
          <input name="openings" type="number" min="1" defaultValue={demand?.openings ?? 1} className="field-input mt-2" />
        </label>
        <label className="text-sm font-semibold">
          Escolaridade mínima
          <select
            name="educationMinimum"
            value={educationMinimum}
            onChange={(event) => {
              setEducationTouched(true);
              setEducationMinimum(event.target.value);
            }}
            className="field-input mt-2"
          >
            <option value="fundamental">Fundamental</option>
            <option value="medio">Medio</option>
            <option value="tecnico">Técnico</option>
            <option value="superior">Superior</option>
            <option value="pos">Pos-graduacao</option>
            <option value="mba">MBA</option>
            <option value="mestrado">Mestrado</option>
            <option value="doutorado">Doutorado</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Cidade
          <input name="city" required defaultValue={defaultCity} className="field-input mt-2" />
        </label>
        <label className="text-sm font-semibold">
          Estado
          <input name="state" required maxLength={2} defaultValue={defaultState} className="field-input mt-2" />
        </label>
        <label className="text-sm font-semibold">
          Modalidade
          <select name="modality" defaultValue={demand?.modality ?? "presencial"} className="field-input mt-2">
            <option value="presencial">Presencial</option>
            <option value="hibrido">Hibrido</option>
            <option value="remoto">Remoto</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Contrato
          <select name="contractType" defaultValue={demand?.contractType ?? "clt"} className="field-input mt-2">
            <option value="clt">CLT</option>
            <option value="pj">PJ</option>
            <option value="temporario">Temporario</option>
            <option value="estagio">Estagio</option>
            <option value="aprendiz">Aprendiz</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Experiência mínima em meses
          <input name="minimumExperienceMonths" type="number" min="0" defaultValue={demand?.minimumExperienceMonths ?? 0} className="field-input mt-2" />
        </label>
        {demand?.id ? (
          <label className="text-sm font-semibold">
            Status
            <select name="status" defaultValue={demand.status ?? "active"} className="field-input mt-2">
              <option value="draft">Rascunho</option>
              <option value="active">Ativa</option>
              <option value="screening">Em triagem</option>
              <option value="closed">Encerrada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </label>
        ) : null}
        <label className="text-sm font-semibold">
          Habilidades técnicas
          <input name="technicalSkills" defaultValue={technicalSkillsValue} placeholder="Excel, atendimento, logistica" className="field-input mt-2" />
        </label>
        <label className="text-sm font-semibold md:col-span-2">
          Cursos obrigatórios
          <input name="requiredCourses" defaultValue={requiredCoursesValue} placeholder="NR-10, Excel intermediário" className="field-input mt-2" />
        </label>
      </div>
      <button className="mt-5 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
