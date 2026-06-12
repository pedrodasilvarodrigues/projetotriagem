export type AppLanguage = "pt-BR" | "en-US" | "es-ES";

const uiMaps: Record<AppLanguage, Record<string, string>> = {
  "pt-BR": {},
  "en-US": {
    Empresa: "Company",
    Profissional: "Professional",
    Administrador: "Administrator",
    "Minha Empresa": "My Company",
    "Perfil da Empresa": "Company Profile",
    "Criar Demanda": "Create Demand",
    "Demandas Ativas": "Active Demands",
    "Analise de Candidatos": "Candidate Review",
    "Configuracoes": "Settings",
    "Editar Demanda": "Edit Demand",
    "Minha Area": "My Area",
    Perfil: "Profile",
    Curriculo: "Resume",
    "Status de Triagem": "Screening Status",
    Encaminhamentos: "Referrals",
    Notificacoes: "Notifications"
  },
  "es-ES": {
    Empresa: "Empresa",
    Profissional: "Profesional",
    Administrador: "Administrador",
    "Minha Empresa": "Mi Empresa",
    "Perfil da Empresa": "Perfil de la Empresa",
    "Criar Demanda": "Crear Demanda",
    "Demandas Ativas": "Demandas Activas",
    "Analise de Candidatos": "Analisis de Candidatos",
    "Configuracoes": "Configuraciones",
    "Editar Demanda": "Editar Demanda",
    "Minha Area": "Mi Area",
    Perfil: "Perfil",
    Curriculo: "Curriculum",
    "Status de Triagem": "Estado de Seleccion",
    Encaminhamentos: "Derivaciones",
    Notificacoes: "Notificaciones"
  }
};

export function translateUi(text: string, language: AppLanguage) {
  return uiMaps[language][text] ?? text;
}
