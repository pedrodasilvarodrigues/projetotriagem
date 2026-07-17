"use client";

import { useEffect, useState } from "react";
import { Bell, ChevronDown, Languages, ShieldCheck, Store } from "lucide-react";

type SettingsPreferencesProps = {
  prefs: {
    email_notifications: boolean;
    opportunity_alerts: boolean;
    profile_visible: boolean;
    allow_recruiter_contact: boolean;
    show_salary_expectation: boolean;
    preferred_language?: string;
    service_marketplace_enabled?: boolean;
  };
  labels?: Partial<{
    notificationsTitle: string;
    notificationsDescription: string;
    emailPlatformTitle: string;
    emailPlatformDescription: string;
    alertsTitle: string;
    alertsDescription: string;
    privacyTitle: string;
    privacyDescription: string;
    profileVisibleTitle: string;
    profileVisibleDescription: string;
    recruiterContactTitle: string;
    recruiterContactDescription: string;
    salaryTitle: string;
    salaryDescription: string;
    languageTitle: string;
    languageDescription: string;
    primaryLanguageLabel: string;
    languageHelp: string;
  }>;
};

type PanelId = "notifications" | "privacy" | "language";

const languages = [
  { value: "pt-BR", label: "Portugues (Brasil)" },
  { value: "en-US", label: "Ingles" },
  { value: "es-ES", label: "Espanhol" }
];

const localizedLabels = {
  "pt-BR": {
    notificationsTitle: "Notificações",
    notificationsDescription: "Emails da plataforma e alertas de vagas.",
    emailPlatformTitle: "Emails da plataforma",
    emailPlatformDescription: "Receber avisos importantes sobre processos, triagens e mensagens.",
    alertsTitle: "Alertas de vagas",
    alertsDescription: "Receber oportunidades de acordo com cidades, perfil e currículo.",
    privacyTitle: "Privacidade do perfil",
    privacyDescription: "Visibilidade do currículo e contato por recrutadores.",
    profileVisibleTitle: "Perfil visível para triagem",
    profileVisibleDescription: "Permitir que recrutadores internos encontrem seu currículo.",
    recruiterContactTitle: "Contato por recrutadores",
    recruiterContactDescription: "Permitir contato em processos compatíveis.",
    salaryTitle: "Mostrar pretensão salarial",
    salaryDescription: "Exibir essa informação quando ela existir no perfil.",
    languageTitle: "Idioma",
    languageDescription: "Preferência de idioma da sua experiência.",
    primaryLanguageLabel: "Idioma principal",
    languageHelp: "A seleção fica salva no seu perfil e prepara a plataforma para exibir sua experiência no idioma escolhido."
  },
  "en-US": {
    notificationsTitle: "Notifications",
    notificationsDescription: "Platform emails and job alerts.",
    emailPlatformTitle: "Platform emails",
    emailPlatformDescription: "Receive important updates about processes, screening and messages.",
    alertsTitle: "Job alerts",
    alertsDescription: "Receive opportunities based on cities, profile and resume.",
    privacyTitle: "Profile privacy",
    privacyDescription: "Resume visibility and recruiter contact.",
    profileVisibleTitle: "Visible for screening",
    profileVisibleDescription: "Allow internal recruiters to find your resume.",
    recruiterContactTitle: "Recruiter contact",
    recruiterContactDescription: "Allow contact in compatible processes.",
    salaryTitle: "Show salary expectation",
    salaryDescription: "Display this information when it exists in your profile.",
    languageTitle: "Language",
    languageDescription: "Language preference for your experience.",
    primaryLanguageLabel: "Primary language",
    languageHelp: "Your selection is saved in your profile and updates the platform experience to the chosen language."
  },
  "es-ES": {
    notificationsTitle: "Notificaciones",
    notificationsDescription: "Correos de la plataforma y alertas de vacantes.",
    emailPlatformTitle: "Correos de la plataforma",
    emailPlatformDescription: "Recibir avisos importantes sobre procesos, seleccion y mensajes.",
    alertsTitle: "Alertas de vacantes",
    alertsDescription: "Recibir oportunidades segun ciudades, perfil y curriculum.",
    privacyTitle: "Privacidad del perfil",
    privacyDescription: "Visibilidad del curriculum y contacto de reclutadores.",
    profileVisibleTitle: "Perfil visible para seleccion",
    profileVisibleDescription: "Permitir que reclutadores internos encuentren tu curriculum.",
    recruiterContactTitle: "Contacto de reclutadores",
    recruiterContactDescription: "Permitir contacto en procesos compatibles.",
    salaryTitle: "Mostrar aspiracion salarial",
    salaryDescription: "Mostrar está informacion cuando exista en tu perfil.",
    languageTitle: "Idioma",
    languageDescription: "Preferência de idioma de tu experiência.",
    primaryLanguageLabel: "Idioma principal",
    languageHelp: "La seleccion se guarda en tu perfil y actualiza la experiência de la plataforma al idioma elegido."
  }
} as const;

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

export function SettingsPreferences({ prefs, labels }: SettingsPreferencesProps) {
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);
  const [language, setLanguage] = useState(prefs.preferred_language ?? "pt-BR");
  const copy = { ...localizedLabels[language as keyof typeof localizedLabels], ...(labels ?? {}) };

  useEffect(() => {
    const savedLanguage = prefs.preferred_language || window.localStorage.getItem("triagem-preferred-language");
    if (savedLanguage && languages.some((item) => item.value === savedLanguage)) {
      setLanguage(savedLanguage);
      document.documentElement.lang = savedLanguage;
    }
  }, [prefs.preferred_language]);

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
      {typeof prefs.service_marketplace_enabled === "boolean" ? <section className="border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-start gap-3">
          <Store aria-hidden="true" className="mt-0.5 text-[#F2811D]" size={21} />
          <div><h2 className="font-semibold text-[#0F2D4E]">Prestadores de serviços</h2><p className="mt-1 text-sm leading-6 text-slate-600">Você decide se deseja visualizar e utilizar a área de prestadores na sua conta profissional.</p></div>
        </div>
        <ToggleOption name="serviceMarketplaceEnabled" title="Exibir prestadores de serviços" description="Ao desativar, o feed, Meus serviços, conversas e notificações de serviços deixam de aparecer somente para você." defaultChecked={prefs.service_marketplace_enabled} />
      </section> : null}

      <section>
        <PanelButton id="notifications" title={copy.notificationsTitle} description={copy.notificationsDescription} icon={Bell} />
        <div className={`${openPanel === "notifications" ? "grid" : "hidden"} gap-3 border-x border-b border-slate-200 bg-slate-50 p-4 md:grid-cols-2`}>
          <ToggleOption name="emailNotifications" title={copy.emailPlatformTitle} description={copy.emailPlatformDescription} defaultChecked={prefs.email_notifications} />
          <ToggleOption name="opportunityAlerts" title={copy.alertsTitle} description={copy.alertsDescription} defaultChecked={prefs.opportunity_alerts} />
        </div>
      </section>

      <section>
        <PanelButton id="privacy" title={copy.privacyTitle} description={copy.privacyDescription} icon={ShieldCheck} />
        <div className={`${openPanel === "privacy" ? "grid" : "hidden"} gap-3 border-x border-b border-slate-200 bg-slate-50 p-4 md:grid-cols-2`}>
          <ToggleOption name="profileVisible" title={copy.profileVisibleTitle} description={copy.profileVisibleDescription} defaultChecked={prefs.profile_visible} />
          <ToggleOption name="allowRecruiterContact" title={copy.recruiterContactTitle} description={copy.recruiterContactDescription} defaultChecked={prefs.allow_recruiter_contact} />
          <ToggleOption name="showSalaryExpectation" title={copy.salaryTitle} description={copy.salaryDescription} defaultChecked={prefs.show_salary_expectation} />
        </div>
      </section>

      <section>
        <PanelButton id="language" title={copy.languageTitle} description={copy.languageDescription} icon={Languages} />
        <div className={`${openPanel === "language" ? "block" : "hidden"} border-x border-b border-slate-200 bg-slate-50 p-4`}>
          <label className="text-sm font-semibold text-slate-950">
            {copy.primaryLanguageLabel}
            <select name="preferredLanguage" value={language} onChange={(event) => updateLanguage(event.target.value)} className="field-input mt-2">
              {languages.map((item) => (
                <option key={item.value} value={item.value}>
                  {language === "en-US"
                    ? item.value === "pt-BR"
                      ? "Portuguese (Brazil)"
                      : item.value === "en-US"
                        ? "English"
                        : "Spanish"
                    : language === "es-ES"
                      ? item.value === "pt-BR"
                        ? "Portugues (Brasil)"
                        : item.value === "en-US"
                          ? "Ingles"
                          : "Espanol"
                      : item.label}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-3 text-sm leading-6 text-slate-600">{copy.languageHelp}</p>
        </div>
      </section>
    </div>
  );
}
