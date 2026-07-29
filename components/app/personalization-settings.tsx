"use client";

import { Check, Contrast, MonitorCog, Moon, Rows3, Sun, Type } from "lucide-react";
import {
  type DensityPreference,
  type FontSizePreference,
  type ThemePreference,
  useUserPreferences
} from "@/components/app/user-preferences-provider";

type Choice<Value extends string> = {
  value: Value;
  label: string;
  description: string;
  icon?: typeof Sun;
  preview?: React.ReactNode;
};

const themeChoices: Choice<ThemePreference>[] = [
  { value: "claro", label: "Claro", description: "Superfícies claras e contraste suave.", icon: Sun },
  { value: "escuro", label: "Escuro", description: "Paleta noturna calibrada para leitura.", icon: Moon },
  { value: "automatico", label: "Automático", description: "Acompanha o tema do seu dispositivo.", icon: MonitorCog }
];

const fontChoices: Choice<FontSizePreference>[] = [
  { value: "pequeno", label: "Pequeno", description: "Mais conteúdo visível.", preview: <span className="text-xs font-bold">Aa</span> },
  { value: "medio", label: "Médio", description: "Equilíbrio recomendado.", preview: <span className="text-base font-bold">Aa</span> },
  { value: "grande", label: "Grande", description: "Leitura mais confortável.", preview: <span className="text-xl font-bold">Aa</span> }
];

const densityChoices: Choice<DensityPreference>[] = [
  { value: "compacta", label: "Compacta", description: "Mais linhas e informações por tela.", icon: Rows3 },
  { value: "confortavel", label: "Confortável", description: "Espaçamento amplo e ritmo atual.", icon: Contrast }
];

function PreferenceGroup<Value extends string>({
  label,
  description,
  choices,
  value,
  onChange
}: {
  label: string;
  description: string;
  choices: Choice<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <section className="preference-group" aria-labelledby={`preference-${label}`}>
      <div className="preference-group__heading">
        <h3 id={`preference-${label}`}>{label}</h3>
        <p>{description}</p>
      </div>
      <div className="preference-options" role="radiogroup" aria-label={label}>
        {choices.map((choice) => {
          const selected = choice.value === value;
          const Icon = choice.icon;
          return (
            <button
              key={choice.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`preference-option ${selected ? "preference-option--selected" : ""}`}
              onClick={() => onChange(choice.value)}
            >
              <span className="preference-option__visual">
                {Icon ? <Icon aria-hidden="true" size={20} /> : choice.preview}
              </span>
              <span className="min-w-0">
                <strong>{choice.label}</strong>
                <small>{choice.description}</small>
              </span>
              <span className="preference-option__check" aria-hidden="true">
                {selected ? <Check size={14} strokeWidth={3} /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function PersonalizationSettings() {
  const { preferences, updatePreference } = useUserPreferences();

  return (
    <section className="personalization-panel">
      <header className="personalization-panel__header">
        <span className="personalization-panel__icon"><Type aria-hidden="true" size={22} /></span>
        <div>
          <p>Experiência visual</p>
          <h2>Personalização</h2>
          <span>As mudanças são aplicadas imediatamente e acompanham sua conta em outros dispositivos.</span>
        </div>
      </header>

      <div className="personalization-panel__body">
        <PreferenceGroup
          label="Tema"
          description="Escolha como as cores do Portal Encaixe aparecem para você."
          choices={themeChoices}
          value={preferences.tema}
          onChange={(value) => void updatePreference("tema", value)}
        />
        <PreferenceGroup
          label="Tamanho de fonte"
          description="Ajuste a escala de leitura em toda a plataforma."
          choices={fontChoices}
          value={preferences.tamanho_fonte}
          onChange={(value) => void updatePreference("tamanho_fonte", value)}
        />
        <PreferenceGroup
          label="Densidade da interface"
          description="Defina o espaço usado por cards, tabelas e formulários."
          choices={densityChoices}
          value={preferences.densidade}
          onChange={(value) => void updatePreference("densidade", value)}
        />
      </div>
    </section>
  );
}
