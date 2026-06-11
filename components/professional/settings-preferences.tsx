"use client";

import { useEffect, useState } from "react";
import { Bell, ChevronDown, Languages, ShieldCheck } from "lucide-react";

type SettingsPreferencesProps = {
  prefs: {
    email_notifications: boolean;
    opportunity_alerts: boolean;
    profile_visible: boolean;
    allow_recruiter_contact: boolean;
    show_salary_expectation: boolean;
  };
};

type PanelId = "notifications" | "privacy" | "language";

const languages = [
  { value: "pt-BR", label: "Portugues (Brasil)" },
  { value: "en-US", label: "Ingles" },
  { value: "es-ES", label: "Espanhol" }
];

function ToggleOption({ name, title, description, defaultChecked }: { name: string; title: string; description: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border border-slate-200 bg-white p-4 text-sm transition hover:border-blue-200 hover:bg-blue-50/40">
      <span>
        <strong className="block text-slate-950">{title}</strong>
        <span className="mt-1 block leading-6 text-slate-600">{description}</span>
      </span>
      <span className="relative mt-1 inline-flex shrink-0">
        <input name={name} type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-blue-700" />
        <span className="absolute left-1 top-1 size-4 rounded-full bg-white transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function SettingsPreferences({ prefs }: SettingsPreferencesProps) {
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);
  const [language, setLanguage] = useState("pt-BR");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("triagem-preferred-language");
    if (savedLanguage && languages.some((item) => item.value === savedLanguage)) {
      setLanguage(savedLanguage);
      document.documentElement.lang = savedLanguage;
    }
  }, []);

  function updateLanguage(value: string) {
    setLanguage(value);
    window.localStorage.setItem("triagem-preferred-language", value);
    document.documentElement.lang = value;
  }

  function PanelButton({ id, title, description, icon: Icon }: { id: PanelId; title: string; description: string; icon: typeof Bell }) {
    const isOpen = openPanel === id;

    return (
      <button
        type="button"
        onClick={() => setOpenPanel(isOpen ? null : id)}
        className={`flex w-full items-center justify-between gap-4 border p-4 text-left transition ${isOpen ? "border-blue-700 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white"}`}
      >
        <span className="flex items-start gap-3">
          <Icon aria-hidden="true" size={20} className="mt-0.5 text-blue-700" />
          <span>
            <strong className="block text-slate-950">{title}</strong>
            <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
          </span>
        </span>
        <ChevronDown aria-hidden="true" size={18} className={`shrink-0 text-slate-500 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>
    );
  }

  return (
    <div className="grid gap-4">
      <section>
        <PanelButton id="notifications" title="Notificacoes" description="Emails da plataforma e alertas de vagas." icon={Bell} />
        <div className={`${openPanel === "notifications" ? "grid" : "hidden"} gap-3 border-x border-b border-slate-200 bg-slate-50 p-4 md:grid-cols-2`}>
          <ToggleOption name="emailNotifications" title="Emails da plataforma" description="Receber avisos importantes sobre processos, triagens e mensagens." defaultChecked={prefs.email_notifications} />
          <ToggleOption name="opportunityAlerts" title="Alertas de vagas" description="Receber oportunidades de acordo com cidades, perfil e curriculo." defaultChecked={prefs.opportunity_alerts} />
        </div>
      </section>

      <section>
        <PanelButton id="privacy" title="Privacidade do perfil" description="Visibilidade do curriculo e contato por recrutadores." icon={ShieldCheck} />
        <div className={`${openPanel === "privacy" ? "grid" : "hidden"} gap-3 border-x border-b border-slate-200 bg-slate-50 p-4 md:grid-cols-2`}>
          <ToggleOption name="profileVisible" title="Perfil visivel para triagem" description="Permitir que recrutadores internos encontrem seu curriculo." defaultChecked={prefs.profile_visible} />
          <ToggleOption name="allowRecruiterContact" title="Contato por recrutadores" description="Permitir contato em processos compativeis." defaultChecked={prefs.allow_recruiter_contact} />
          <ToggleOption name="showSalaryExpectation" title="Mostrar pretensao salarial" description="Exibir essa informacao quando ela existir no perfil." defaultChecked={prefs.show_salary_expectation} />
        </div>
      </section>

      <section>
        <PanelButton id="language" title="Idioma" description="Preferencia de idioma da sua experiencia." icon={Languages} />
        <div className={`${openPanel === "language" ? "block" : "hidden"} border-x border-b border-slate-200 bg-slate-50 p-4`}>
          <label className="text-sm font-semibold text-slate-950">
            Idioma principal
            <select name="preferredLanguage" value={language} onChange={(event) => updateLanguage(event.target.value)} className="field-input mt-2">
              {languages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <p className="mt-3 text-sm leading-6 text-slate-600">A selecao fica salva neste navegador e prepara a plataforma para futuras traducoes.</p>
        </div>
      </section>
    </div>
  );
}
