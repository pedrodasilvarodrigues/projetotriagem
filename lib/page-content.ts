import type { Metric, QuickAction, TableColumn, TableRow } from "@/components/app/operational-page";

export type PageContent = {
  eyebrow: string;
  title: string;
  description: string;
  metrics: Metric[];
  actions: QuickAction[];
  columns: TableColumn[];
  rows: TableRow[];
  formTitle: string;
  formFields: string[];
  timeline: string[];
};

const defaultColumns = [
  { key: "name", label: "Registro" },
  { key: "status", label: "Situação" },
  { key: "owner", label: "Responsável" },
  { key: "updated", label: "Atualização" }
];

export function content(input: {
  eyebrow: string;
  title: string;
  description: string;
  formTitle: string;
  formFields: string[];
  rows: TableRow[];
  metrics?: Metric[];
  actions?: QuickAction[];
  columns?: TableColumn[];
  timeline?: string[];
}): PageContent {
  return {
    eyebrow: input.eyebrow,
    title: input.title,
    description: input.description,
    metrics: input.metrics ?? [
      { label: "Ativos", value: String(input.rows.length), detail: "Registros operacionais nesta visão" },
      { label: "Pendentes", value: "3", detail: "Itens aguardando validação" },
      { label: "SLA", value: "92%", detail: "Fluxos dentro do prazo" }
    ],
    actions: input.actions ?? [
      { label: "Novo registro", tone: "primary" },
      { label: "Exportar", tone: "neutral" }
    ],
    columns: input.columns ?? defaultColumns,
    rows: input.rows,
    formTitle: input.formTitle,
    formFields: input.formFields,
    timeline: input.timeline ?? ["Registro criado", "Validação iniciada", "Notificação enviada"]
  };
}

export const pages = {
  adminAdministration: content({
    eyebrow: "Administrador",
    title: "Administração",
    description: "Centro de controle da plataforma para gerir empresas, profissionais, demandas, triagens, encaminhamentos, termos, LGPD, notificações e parâmetros do sistema.",
    formTitle: "Ação administrativa",
    formFields: ["Módulo", "Ação", "Responsável", "Justificativa"],
    rows: [
      { name: "Empresas", status: "Gestão completa", owner: "Admin", updated: "Hoje" },
      { name: "Profissionais", status: "Gestão completa", owner: "Admin", updated: "Hoje" },
      { name: "LGPD e Termos", status: "Versionado", owner: "DPO", updated: "Ontem" }
    ],
    actions: [
      { label: "Auditar cadastros", tone: "primary" },
      { label: "Revisar termos", tone: "neutral" }
    ]
  }),
  adminCompanies: content({
    eyebrow: "Administrador",
    title: "Empresas",
    description: "Aprovação, auditoria cadastral, contatos e documentos de empresas que registram demandas privadas.",
    formTitle: "Avaliar empresa",
    formFields: ["Razão social", "CNPJ", "Cidade", "Motivo da decisão"],
    rows: [
      { name: "Norte Sul Serviços", status: "Pendente", owner: "Triagem", updated: "Hoje" },
      { name: "Atlas Indústria", status: "Aprovada", owner: "Admin", updated: "Ontem" },
      { name: "Vetor Logística", status: "Em análise", owner: "Compliance", updated: "2 dias" }
    ]
  }),
  adminProfessionals: content({
    eyebrow: "Administrador",
    title: "Profissionais",
    description: "Gestão de perfis, documentos, qualificações, consentimentos e elegibilidade para classificação de compatibilidade.",
    formTitle: "Validar profissional",
    formFields: ["Nome", "Cargo desejado", "Escolaridade", "Observação interna"],
    rows: [
      { name: "Ana Ribeiro", status: "Aprovada", owner: "Admin", updated: "Hoje" },
      { name: "Carlos Lima", status: "Pendente", owner: "Triagem", updated: "Hoje" },
      { name: "Marina Costa", status: "Em espera", owner: "Admin", updated: "Ontem" }
    ]
  }),
  adminDemands: content({
    eyebrow: "Administrador",
    title: "Demandas",
    description: "Demandas internas recebidas de empresas, com requisitos, prazos, volume de vagas e status de triagem.",
    formTitle: "Revisar demanda",
    formFields: ["Cargo", "Empresa", "Situação", "Observações internas"],
    rows: [
      { name: "Analista de PCP", status: "Em triagem", owner: "Atlas Indústria", updated: "Hoje" },
      { name: "Técnico de Segurança", status: "Ativa", owner: "Norte Sul", updated: "Ontem" },
      { name: "Assistente Fiscal", status: "Rascunho", owner: "Vetor", updated: "3 dias" }
    ]
  }),
  adminProcesses: content({
    eyebrow: "Administrador",
    title: "Processos",
    description: "Fluxo completo de encaminhamento com histórico imutável de status, responsáveis e observações.",
    formTitle: "Mover etapa",
    formFields: ["Processo", "Novo status", "Responsável", "Nota"],
    rows: [
      { name: "Ana Ribeiro x Analista de PCP", status: "Pré-aprovado", owner: "Admin", updated: "Hoje" },
      { name: "Carlos Lima x Técnico", status: "Triagem", owner: "Admin", updated: "Hoje" },
      { name: "Marina Costa x Assistente", status: "Entrevista", owner: "Admin", updated: "Ontem" }
    ],
    timeline: ["Recebido", "Em análise", "Triagem", "Pré-aprovado", "Encaminhado"]
  }),
  adminTrainings: content({
    eyebrow: "Administrador",
    title: "Treinamentos",
    description: "Módulo preparado e controlado por recurso de ativação, invisível para empresas e profissionais até a liberação.",
    formTitle: "Criar trilha",
    formFields: ["Título", "Carga horária", "Parceiro", "Ativo"],
    rows: [
      { name: "Ambientação industrial", status: "Desativada", owner: "Admin", updated: "Hoje" },
      { name: "NR-10 básico", status: "Desativada", owner: "Parceiro", updated: "Ontem" },
      { name: "Excel operacional", status: "Desativada", owner: "Admin", updated: "5 dias" }
    ]
  }),
  adminSupport: content({
    eyebrow: "Administrador",
    title: "Suporte",
    description: "Fila de chamados com protocolo, conversa, anexos, status e prazo de reabertura.",
    formTitle: "Responder chamado",
    formFields: ["Protocolo", "Situação", "Mensagem", "Anexo"],
    rows: [
      { name: "PT-2026-0001", status: "Aberto", owner: "Empresa", updated: "Hoje" },
      { name: "PT-2026-0002", status: "Em atendimento", owner: "Profissional", updated: "Hoje" },
      { name: "PT-2026-0003", status: "Aguardando usuário", owner: "Admin", updated: "Ontem" }
    ]
  }),
  adminReports: content({
    eyebrow: "Administrador",
    title: "Relatórios",
    description: "Indicadores exportáveis sobre empresas, demandas, profissionais, pipeline, SLA, suporte e LGPD.",
    formTitle: "Gerar relatório",
    formFields: ["Tipo", "Período inicial", "Período final", "Formato"],
    rows: [
      { name: "Demandas por situação", status: "Disponível", owner: "Sistema", updated: "Hoje" },
      { name: "SLA de triagem", status: "Disponível", owner: "Sistema", updated: "Hoje" },
      { name: "LGPD e consentimentos", status: "Restrito", owner: "DPO", updated: "Ontem" }
    ]
  }),
  adminReviews: content({
    eyebrow: "Administrador",
    title: "Avaliações",
    description: "Painel de satisfação, média geral, NPS calculado, comentários e respostas públicas aos avaliadores.",
    formTitle: "Responder avaliação",
    formFields: ["Avaliador", "Nota", "Resposta", "Visibilidade"],
    rows: [
      { name: "Ana Ribeiro", status: "5 estrelas", owner: "Profissional", updated: "Hoje" },
      { name: "Atlas Indústria", status: "4 estrelas", owner: "Empresa", updated: "Ontem" },
      { name: "Carlos Lima", status: "3 estrelas", owner: "Profissional", updated: "4 dias" }
    ]
  }),
  adminNotifications: content({
    eyebrow: "Administrador",
    title: "Notificações",
    description: "Modelos, disparos internos em tempo real, registros de email e eventos transacionais do sistema.",
    formTitle: "Criar aviso",
    formFields: ["Título", "Público", "Mensagem", "Canal"],
    rows: [
      { name: "Perfil aprovado", status: "Ativo", owner: "Sistema", updated: "Hoje" },
      { name: "Situação alterada", status: "Ativo", owner: "Sistema", updated: "Hoje" },
      { name: "Treinamento disponível", status: "Futuro", owner: "Admin", updated: "Ontem" }
    ]
  }),
  adminSettings: content({
    eyebrow: "Administrador",
    title: "Configurações",
    description: "Preferências globais, LGPD, DPO, termos, política de privacidade, acessibilidade e segurança.",
    formTitle: "Atualizar configuração",
    formFields: ["Nome da plataforma", "Email DPO", "Versão dos termos", "Alto contraste"],
    rows: [
      { name: "Política de privacidade", status: "Versionada", owner: "DPO", updated: "Hoje" },
      { name: "Termos de uso", status: "Versionado", owner: "Jurídico", updated: "Ontem" },
      { name: "Módulo treinamentos", status: "Desativado", owner: "Admin", updated: "Hoje" }
    ]
  }),
  companyDemands: content({
    eyebrow: "Empresa",
    title: "Minhas demandas",
    description: "Registro privado de demandas internas, sem publicação pública e com acompanhamento administrado.",
    formTitle: "Registrar demanda",
    formFields: ["Cargo", "Escolaridade mínima", "Cidade", "Prazo"],
    rows: [
      { name: "Analista de PCP", status: "Em triagem", owner: "Minha empresa", updated: "Hoje" },
      { name: "Auxiliar de produção", status: "Ativa", owner: "Minha empresa", updated: "Ontem" },
      { name: "Técnico mecânico", status: "Encerrada", owner: "Minha empresa", updated: "Maio" }
    ]
  }),
  companyProfile: content({
    eyebrow: "Empresa",
    title: "Perfil empresarial",
    description: "Dados da empresa, responsáveis, configurações operacionais e preferências de contato para acompanhamento das demandas privadas.",
    formTitle: "Atualizar empresa",
    formFields: ["Razão social", "Responsável", "Email corporativo", "Telefone"],
    rows: [
      { name: "Dados cadastrais", status: "Completo", owner: "Empresa", updated: "Hoje" },
      { name: "Responsáveis", status: "Validado", owner: "Empresa", updated: "Hoje" },
      { name: "Configurações", status: "Padrão", owner: "Empresa", updated: "Ontem" }
    ],
    actions: [{ label: "Salvar perfil", tone: "primary" }]
  }),
  companyCompatibility: content({
    eyebrow: "Empresa",
    title: "Compatibilidade",
    description: "Candidatos compatíveis com demandas da própria empresa, com pontuação e classificação liberados conforme regras de encaminhamento.",
    formTitle: "Filtrar classificação",
    formFields: ["Demanda", "Pontuação mínima", "Cidade", "Situação"],
    rows: [
      { name: "Ana Ribeiro", status: "92 pontos", owner: "Analista de PCP", updated: "Hoje" },
      { name: "Marina Costa", status: "84 pontos", owner: "Assistente Fiscal", updated: "Ontem" },
      { name: "Carlos Lima", status: "78 pontos", owner: "Técnico mecânico", updated: "3 dias" }
    ],
    actions: [{ label: "Solicitar triagem", tone: "primary" }]
  }),
  companyProcesses: content({
    eyebrow: "Empresa",
    title: "Processos",
    description: "Triagens, entrevistas, contratações e resultados relacionados apenas às demandas cadastradas pela empresa.",
    formTitle: "Atualizar processo",
    formFields: ["Candidato", "Demanda", "Etapa", "Resultado"],
    rows: [
      { name: "Ana Ribeiro", status: "Entrevista", owner: "Analista de PCP", updated: "Hoje" },
      { name: "Carlos Lima", status: "Triagem", owner: "Técnico mecânico", updated: "Hoje" },
      { name: "Marina Costa", status: "Contratação", owner: "Assistente Fiscal", updated: "Ontem" }
    ],
    timeline: ["Triagem", "Entrevista", "Resultado", "Contratação"]
  }),
  companyCandidates: content({
    eyebrow: "Empresa",
    title: "Candidatos encaminhados",
    description: "Somente profissionais liberados pelo administrador aparecem nesta área, sem classificação completa ou pontuações internas.",
    formTitle: "Registrar resultado",
    formFields: ["Candidato", "Demanda", "Resultado", "Observação"],
    rows: [
      { name: "Ana Ribeiro", status: "Encaminhada", owner: "Analista de PCP", updated: "Hoje" },
      { name: "Marina Costa", status: "Entrevista", owner: "Assistente Fiscal", updated: "Ontem" },
      { name: "Carlos Lima", status: "Treinamento", owner: "Técnico", updated: "3 dias" }
    ]
  }),
  companyHistory: content({
    eyebrow: "Empresa",
    title: "Histórico",
    description: "Arquivo completo de processos anteriores, resultados e rastreabilidade por demanda.",
    formTitle: "Filtrar histórico",
    formFields: ["Período", "Situação", "Demanda", "Resultado"],
    rows: [
      { name: "Campanha Maio", status: "Encerrada", owner: "Admin", updated: "Maio" },
      { name: "Campanha Abril", status: "Encerrada", owner: "Admin", updated: "Abril" },
      { name: "Campanha Março", status: "Encerrada", owner: "Admin", updated: "Março" }
    ]
  }),
  companySupport: content({
    eyebrow: "Empresa",
    title: "Suporte",
    description: "Abertura e acompanhamento de chamados com protocolo, anexos e histórico da conversa.",
    formTitle: "Abrir chamado",
    formFields: ["Título", "Categoria", "Descrição", "Anexo"],
    rows: [
      { name: "PT-2026-0091", status: "Aberto", owner: "Minha empresa", updated: "Hoje" },
      { name: "PT-2026-0084", status: "Resolvido", owner: "Admin", updated: "Ontem" },
      { name: "PT-2026-0072", status: "Fechado", owner: "Admin", updated: "Maio" }
    ]
  }),
  professionalProfile: content({
    eyebrow: "Profissional",
    title: "Perfil",
    description: "Dados pessoais, cargo desejado, contato, localização, disponibilidade, consentimentos e preferência de acessibilidade.",
    formTitle: "Editar perfil",
    formFields: ["Nome completo", "Cargo desejado", "Cidade", "Disponibilidade"],
    rows: [
      { name: "Dados pessoais", status: "Completo", owner: "Usuário", updated: "Hoje" },
      { name: "Consentimento LGPD", status: "Aceito", owner: "Usuário", updated: "Hoje" },
      { name: "Preferências", status: "Padrão", owner: "Usuário", updated: "Ontem" }
    ]
  }),
  professionalExperiences: content({
    eyebrow: "Profissional",
    title: "Experiências",
    description: "Histórico profissional detalhado em ordem cronológica inversa, usado no pontuação de experiência.",
    formTitle: "Adicionar experiência",
    formFields: ["Empresa", "Cargo", "Início", "Descrição"],
    rows: [
      { name: "Operador de produção", status: "Atual", owner: "Empresa A", updated: "Hoje" },
      { name: "Auxiliar técnico", status: "Finalizada", owner: "Empresa B", updated: "2025" },
      { name: "Aprendiz", status: "Finalizada", owner: "Empresa C", updated: "2024" }
    ]
  }),
  professionalEducation: content({
    eyebrow: "Profissional",
    title: "Formação",
    description: "Escolaridade formal, instituições e cursos acadêmicos usados no critério de escolaridade mínima.",
    formTitle: "Adicionar formação",
    formFields: ["Nível", "Instituição", "Curso", "Conclusão"],
    rows: [
      { name: "Técnico em Mecânica", status: "Concluído", owner: "SENAI", updated: "2025" },
      { name: "Ensino médio", status: "Concluído", owner: "Escola Estadual", updated: "2022" },
      { name: "Superior", status: "Em andamento", owner: "Faculdade", updated: "Hoje" }
    ]
  }),
  professionalCourses: content({
    eyebrow: "Profissional",
    title: "Cursos e certificados",
    description: "Cursos livres, certificações, anexos e validade para cruzamento com requisitos obrigatórios.",
    formTitle: "Adicionar curso",
    formFields: ["Nome", "Instituição", "Carga horária", "Certificado"],
    rows: [
      { name: "NR-10", status: "Válido", owner: "SENAI", updated: "Hoje" },
      { name: "Excel intermediário", status: "Concluído", owner: "Escola Online", updated: "Ontem" },
      { name: "Lean manufacturing", status: "Concluído", owner: "Parceiro", updated: "2025" }
    ]
  }),
  professionalSkills: content({
    eyebrow: "Profissional",
    title: "Competências",
    description: "Competências técnicas e comportamentais ponderadas pelo algoritmo de compatibilidade.",
    formTitle: "Adicionar competência",
    formFields: ["Nome", "Tipo", "Nível", "Comprovação"],
    rows: [
      { name: "Excel", status: "Técnica", owner: "Nível 4", updated: "Hoje" },
      { name: "Metrologia", status: "Técnica", owner: "Nível 3", updated: "Ontem" },
      { name: "Comunicação", status: "Comportamental", owner: "Nível 5", updated: "Hoje" }
    ]
  }),
  professionalCompatibility: content({
    eyebrow: "Profissional",
    title: "Compatibilidade",
    description: "Pontuação de compatibilidade, motivos da pontuação, oportunidades compatíveis e competências faltantes para melhorar a aderência do perfil.",
    formTitle: "Refinar oportunidades",
    formFields: ["Cargo desejado", "Cidade", "Modalidade", "Disponibilidade"],
    rows: [
      { name: "Analista de PCP", status: "88 pontos", owner: "Motivo: cursos e experiência", updated: "Hoje" },
      { name: "Assistente Fiscal", status: "74 pontos", owner: "Motivo: localidade compatível", updated: "Ontem" },
      { name: "Técnico mecânico", status: "61 pontos", owner: "Melhorar certificações", updated: "3 dias" }
    ],
    actions: [{ label: "Atualizar perfil", tone: "primary" }]
  }),
  professionalResume: content({
    eyebrow: "Profissional",
    title: "Currículo",
    description: "Geração de PDF A4 sob demanda, armazenamento temporário e invalidação automática ao alterar o perfil.",
    formTitle: "Gerar currículo",
    formFields: ["Modelo", "Idioma", "Resumo", "Versão"],
    rows: [
      { name: "Currículo gerado", status: "Ativo", owner: "Sistema", updated: "Hoje" },
      { name: "Currículo enviado", status: "Opcional", owner: "Usuário", updated: "Não enviado" },
      { name: "PDF armazenado", status: "Válido", owner: "Armazenamento", updated: "Hoje" }
    ]
  }),
  professionalProcesses: content({
    eyebrow: "Profissional",
    title: "Processos",
    description: "Acompanhamento privado dos encaminhamentos, com status relevante e sem revelar dados restritos antes da liberação.",
    formTitle: "Filtrar processos",
    formFields: ["Situação", "Período", "Tipo", "Localidade"],
    rows: [
      { name: "Processo 0001", status: "Triagem", owner: "Admin", updated: "Hoje" },
      { name: "Processo 0002", status: "Treinamento", owner: "Admin", updated: "Ontem" },
      { name: "Processo 0003", status: "Encaminhado", owner: "Admin", updated: "Maio" }
    ],
    actions: [{ label: "Exportar histórico", tone: "neutral" }]
  }),
  professionalNotifications: content({
    eyebrow: "Profissional",
    title: "Notificações",
    description: "Avisos internos, situação do processo, suporte, emails transacionais e marcação de leitura.",
    formTitle: "Preferências",
    formFields: ["Email", "Notificação interna", "Processos", "Suporte"],
    rows: [
      { name: "Situação atualizada", status: "Não lida", owner: "Sistema", updated: "Hoje" },
      { name: "Perfil aprovado", status: "Lida", owner: "Sistema", updated: "Ontem" },
      { name: "Resposta suporte", status: "Lida", owner: "Suporte", updated: "Maio" }
    ],
    actions: [{ label: "Marcar todas como lidas", tone: "primary" }]
  }),
  professionalDevelopment: content({
    eyebrow: "Profissional",
    title: "Desenvolvimento",
    description: "Cursos sugeridos, competências faltantes e melhorias recomendadas com base nas oportunidades compatíveis.",
    formTitle: "Plano de melhoria",
    formFields: ["Competencia", "Curso sugerido", "Prioridade", "Prazo"],
    rows: [
      { name: "Excel intermediário", status: "Sugerido", owner: "Alta prioridade", updated: "Hoje" },
      { name: "NR-10", status: "Certificação faltante", owner: "Média prioridade", updated: "Ontem" },
      { name: "Comunicação", status: "Melhoria recomendada", owner: "Baixa prioridade", updated: "3 dias" }
    ],
    actions: [{ label: "Montar plano", tone: "primary" }]
  }),
  professionalSupport: content({
    eyebrow: "Profissional",
    title: "Suporte",
    description: "Canal de atendimento com categorias, anexos, protocolo e reabertura em até 7 dias.",
    formTitle: "Abrir chamado",
    formFields: ["Título", "Categoria", "Descrição", "Anexo"],
    rows: [
      { name: "PT-2026-0120", status: "Aberto", owner: "Usuário", updated: "Hoje" },
      { name: "PT-2026-0118", status: "Resolvido", owner: "Admin", updated: "Ontem" },
      { name: "PT-2026-0104", status: "Fechado", owner: "Admin", updated: "Maio" }
    ]
  })
} satisfies Record<string, PageContent>;
