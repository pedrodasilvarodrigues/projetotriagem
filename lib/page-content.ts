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
  { key: "status", label: "Status" },
  { key: "owner", label: "Responsavel" },
  { key: "updated", label: "Atualizacao" }
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
      { label: "Ativos", value: String(input.rows.length), detail: "Registros operacionais nesta visao" },
      { label: "Pendentes", value: "3", detail: "Itens aguardando validacao" },
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
    timeline: input.timeline ?? ["Registro criado", "Validacao iniciada", "Notificacao enviada"]
  };
}

export const pages = {
  adminAdministration: content({
    eyebrow: "Administrador",
    title: "Administracao",
    description: "Centro de controle da plataforma para gerir empresas, profissionais, demandas, triagens, encaminhamentos, termos, LGPD, notificacoes e parametros do sistema.",
    formTitle: "Acao administrativa",
    formFields: ["Modulo", "Acao", "Responsavel", "Justificativa"],
    rows: [
      { name: "Empresas", status: "Gestao completa", owner: "Admin", updated: "Hoje" },
      { name: "Profissionais", status: "Gestao completa", owner: "Admin", updated: "Hoje" },
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
    description: "Aprovacao, auditoria cadastral, contatos e documentos de empresas que registram demandas privadas.",
    formTitle: "Avaliar empresa",
    formFields: ["Razao social", "CNPJ", "Cidade", "Motivo da decisao"],
    rows: [
      { name: "Norte Sul Servicos", status: "Pendente", owner: "Triagem", updated: "Hoje" },
      { name: "Atlas Industria", status: "Aprovada", owner: "Admin", updated: "Ontem" },
      { name: "Vetor Logistica", status: "Em analise", owner: "Compliance", updated: "2 dias" }
    ]
  }),
  adminProfessionals: content({
    eyebrow: "Administrador",
    title: "Profissionais",
    description: "Gestao de perfis, documentos, qualificacoes, consentimentos e elegibilidade para ranking de compatibilidade.",
    formTitle: "Validar profissional",
    formFields: ["Nome", "Cargo desejado", "Escolaridade", "Observacao interna"],
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
    formFields: ["Cargo", "Empresa", "Status", "Observacoes internas"],
    rows: [
      { name: "Analista de PCP", status: "Em triagem", owner: "Atlas Industria", updated: "Hoje" },
      { name: "Tecnico de Seguranca", status: "Ativa", owner: "Norte Sul", updated: "Ontem" },
      { name: "Assistente Fiscal", status: "Rascunho", owner: "Vetor", updated: "3 dias" }
    ]
  }),
  adminProcesses: content({
    eyebrow: "Administrador",
    title: "Processos",
    description: "Pipeline completo de encaminhamento com historico imutavel de status, responsaveis e observacoes.",
    formTitle: "Mover etapa",
    formFields: ["Processo", "Novo status", "Responsavel", "Nota"],
    rows: [
      { name: "Ana Ribeiro x Analista de PCP", status: "Pre-aprovado", owner: "Admin", updated: "Hoje" },
      { name: "Carlos Lima x Tecnico", status: "Triagem", owner: "Admin", updated: "Hoje" },
      { name: "Marina Costa x Assistente", status: "Entrevista", owner: "Admin", updated: "Ontem" }
    ],
    timeline: ["Recebido", "Em analise", "Triagem", "Pre-aprovado", "Encaminhado"]
  }),
  adminTrainings: content({
    eyebrow: "Administrador",
    title: "Treinamentos",
    description: "Modulo preparado e controlado por feature flag, invisivel para empresas e profissionais ate liberacao.",
    formTitle: "Criar trilha",
    formFields: ["Titulo", "Carga horaria", "Parceiro", "Ativo"],
    rows: [
      { name: "Ambientacao industrial", status: "Desativada", owner: "Admin", updated: "Hoje" },
      { name: "NR-10 basico", status: "Desativada", owner: "Parceiro", updated: "Ontem" },
      { name: "Excel operacional", status: "Desativada", owner: "Admin", updated: "5 dias" }
    ]
  }),
  adminSupport: content({
    eyebrow: "Administrador",
    title: "Suporte",
    description: "Fila de chamados com protocolo, conversa, anexos, status e prazo de reabertura.",
    formTitle: "Responder chamado",
    formFields: ["Protocolo", "Status", "Mensagem", "Anexo"],
    rows: [
      { name: "PT-2026-0001", status: "Aberto", owner: "Empresa", updated: "Hoje" },
      { name: "PT-2026-0002", status: "Em atendimento", owner: "Profissional", updated: "Hoje" },
      { name: "PT-2026-0003", status: "Aguardando usuario", owner: "Admin", updated: "Ontem" }
    ]
  }),
  adminReports: content({
    eyebrow: "Administrador",
    title: "Relatorios",
    description: "Indicadores exportaveis sobre empresas, demandas, profissionais, pipeline, SLA, suporte e LGPD.",
    formTitle: "Gerar relatorio",
    formFields: ["Tipo", "Periodo inicial", "Periodo final", "Formato"],
    rows: [
      { name: "Demandas por status", status: "Disponivel", owner: "Sistema", updated: "Hoje" },
      { name: "SLA de triagem", status: "Disponivel", owner: "Sistema", updated: "Hoje" },
      { name: "LGPD e consentimentos", status: "Restrito", owner: "DPO", updated: "Ontem" }
    ]
  }),
  adminReviews: content({
    eyebrow: "Administrador",
    title: "Avaliacoes",
    description: "Painel de satisfacao, media geral, NPS calculado, comentarios e respostas publicas aos avaliadores.",
    formTitle: "Responder avaliacao",
    formFields: ["Avaliador", "Nota", "Resposta", "Visibilidade"],
    rows: [
      { name: "Ana Ribeiro", status: "5 estrelas", owner: "Profissional", updated: "Hoje" },
      { name: "Atlas Industria", status: "4 estrelas", owner: "Empresa", updated: "Ontem" },
      { name: "Carlos Lima", status: "3 estrelas", owner: "Profissional", updated: "4 dias" }
    ]
  }),
  adminNotifications: content({
    eyebrow: "Administrador",
    title: "Notificacoes",
    description: "Templates, disparos internos em realtime, logs de email e eventos transacionais do sistema.",
    formTitle: "Criar aviso",
    formFields: ["Titulo", "Publico", "Mensagem", "Canal"],
    rows: [
      { name: "Perfil aprovado", status: "Ativo", owner: "Sistema", updated: "Hoje" },
      { name: "Status alterado", status: "Ativo", owner: "Sistema", updated: "Hoje" },
      { name: "Treinamento disponivel", status: "Futuro", owner: "Admin", updated: "Ontem" }
    ]
  }),
  adminSettings: content({
    eyebrow: "Administrador",
    title: "Configuracoes",
    description: "Preferencias globais, LGPD, DPO, termos, politica de privacidade, acessibilidade e seguranca.",
    formTitle: "Atualizar configuracao",
    formFields: ["Nome da plataforma", "Email DPO", "Versao dos termos", "Alto contraste"],
    rows: [
      { name: "Politica de privacidade", status: "Versionada", owner: "DPO", updated: "Hoje" },
      { name: "Termos de uso", status: "Versionado", owner: "Juridico", updated: "Ontem" },
      { name: "Modulo treinamentos", status: "Desativado", owner: "Admin", updated: "Hoje" }
    ]
  }),
  companyDemands: content({
    eyebrow: "Empresa",
    title: "Minhas demandas",
    description: "Registro privado de demandas internas, sem publicacao publica e com acompanhamento administrado.",
    formTitle: "Registrar demanda",
    formFields: ["Cargo", "Escolaridade minima", "Cidade", "Prazo"],
    rows: [
      { name: "Analista de PCP", status: "Em triagem", owner: "Minha empresa", updated: "Hoje" },
      { name: "Auxiliar de producao", status: "Ativa", owner: "Minha empresa", updated: "Ontem" },
      { name: "Tecnico mecanico", status: "Encerrada", owner: "Minha empresa", updated: "Maio" }
    ]
  }),
  companyProfile: content({
    eyebrow: "Empresa",
    title: "Perfil empresarial",
    description: "Dados da empresa, responsaveis, configuracoes operacionais e preferencias de contato para acompanhamento das demandas privadas.",
    formTitle: "Atualizar empresa",
    formFields: ["Razao social", "Responsavel", "Email corporativo", "Telefone"],
    rows: [
      { name: "Dados cadastrais", status: "Completo", owner: "Empresa", updated: "Hoje" },
      { name: "Responsaveis", status: "Validado", owner: "Empresa", updated: "Hoje" },
      { name: "Configuracoes", status: "Padrao", owner: "Empresa", updated: "Ontem" }
    ],
    actions: [{ label: "Salvar perfil", tone: "primary" }]
  }),
  companyCompatibility: content({
    eyebrow: "Empresa",
    title: "Compatibilidade",
    description: "Candidatos compativeis com demandas da propria empresa, com pontuacao e ranking liberados conforme regras de encaminhamento.",
    formTitle: "Filtrar ranking",
    formFields: ["Demanda", "Pontuacao minima", "Cidade", "Status"],
    rows: [
      { name: "Ana Ribeiro", status: "92 pontos", owner: "Analista de PCP", updated: "Hoje" },
      { name: "Marina Costa", status: "84 pontos", owner: "Assistente Fiscal", updated: "Ontem" },
      { name: "Carlos Lima", status: "78 pontos", owner: "Tecnico mecanico", updated: "3 dias" }
    ],
    actions: [{ label: "Solicitar triagem", tone: "primary" }]
  }),
  companyProcesses: content({
    eyebrow: "Empresa",
    title: "Processos",
    description: "Triagens, entrevistas, contratacoes e resultados relacionados apenas as demandas cadastradas pela empresa.",
    formTitle: "Atualizar processo",
    formFields: ["Candidato", "Demanda", "Etapa", "Resultado"],
    rows: [
      { name: "Ana Ribeiro", status: "Entrevista", owner: "Analista de PCP", updated: "Hoje" },
      { name: "Carlos Lima", status: "Triagem", owner: "Tecnico mecanico", updated: "Hoje" },
      { name: "Marina Costa", status: "Contratacao", owner: "Assistente Fiscal", updated: "Ontem" }
    ],
    timeline: ["Triagem", "Entrevista", "Resultado", "Contratacao"]
  }),
  companyCandidates: content({
    eyebrow: "Empresa",
    title: "Candidatos encaminhados",
    description: "Somente profissionais liberados pelo administrador aparecem nesta area, sem ranking completo ou scores internos.",
    formTitle: "Registrar resultado",
    formFields: ["Candidato", "Demanda", "Resultado", "Observacao"],
    rows: [
      { name: "Ana Ribeiro", status: "Encaminhada", owner: "Analista de PCP", updated: "Hoje" },
      { name: "Marina Costa", status: "Entrevista", owner: "Assistente Fiscal", updated: "Ontem" },
      { name: "Carlos Lima", status: "Treinamento", owner: "Tecnico", updated: "3 dias" }
    ]
  }),
  companyHistory: content({
    eyebrow: "Empresa",
    title: "Historico",
    description: "Arquivo completo de processos anteriores, resultados e rastreabilidade por demanda.",
    formTitle: "Filtrar historico",
    formFields: ["Periodo", "Status", "Demanda", "Resultado"],
    rows: [
      { name: "Campanha Maio", status: "Encerrada", owner: "Admin", updated: "Maio" },
      { name: "Campanha Abril", status: "Encerrada", owner: "Admin", updated: "Abril" },
      { name: "Campanha Marco", status: "Encerrada", owner: "Admin", updated: "Marco" }
    ]
  }),
  companySupport: content({
    eyebrow: "Empresa",
    title: "Suporte",
    description: "Abertura e acompanhamento de chamados com protocolo, anexos e thread de conversa.",
    formTitle: "Abrir chamado",
    formFields: ["Titulo", "Categoria", "Descricao", "Anexo"],
    rows: [
      { name: "PT-2026-0091", status: "Aberto", owner: "Minha empresa", updated: "Hoje" },
      { name: "PT-2026-0084", status: "Resolvido", owner: "Admin", updated: "Ontem" },
      { name: "PT-2026-0072", status: "Fechado", owner: "Admin", updated: "Maio" }
    ]
  }),
  professionalProfile: content({
    eyebrow: "Profissional",
    title: "Perfil",
    description: "Dados pessoais, cargo desejado, contato, localizacao, disponibilidade, consentimentos e preferencia de acessibilidade.",
    formTitle: "Editar perfil",
    formFields: ["Nome completo", "Cargo desejado", "Cidade", "Disponibilidade"],
    rows: [
      { name: "Dados pessoais", status: "Completo", owner: "Usuario", updated: "Hoje" },
      { name: "Consentimento LGPD", status: "Aceito", owner: "Usuario", updated: "Hoje" },
      { name: "Preferencias", status: "Padrao", owner: "Usuario", updated: "Ontem" }
    ]
  }),
  professionalExperiences: content({
    eyebrow: "Profissional",
    title: "Experiencias",
    description: "Historico profissional detalhado em ordem cronologica inversa, usado no score de experiencia.",
    formTitle: "Adicionar experiencia",
    formFields: ["Empresa", "Cargo", "Inicio", "Descricao"],
    rows: [
      { name: "Operador de producao", status: "Atual", owner: "Empresa A", updated: "Hoje" },
      { name: "Auxiliar tecnico", status: "Finalizada", owner: "Empresa B", updated: "2025" },
      { name: "Aprendiz", status: "Finalizada", owner: "Empresa C", updated: "2024" }
    ]
  }),
  professionalEducation: content({
    eyebrow: "Profissional",
    title: "Formacao",
    description: "Escolaridade formal, instituicoes e cursos academicos usados no criterio de escolaridade minima.",
    formTitle: "Adicionar formacao",
    formFields: ["Nivel", "Instituicao", "Curso", "Conclusao"],
    rows: [
      { name: "Tecnico em Mecanica", status: "Concluido", owner: "SENAI", updated: "2025" },
      { name: "Ensino medio", status: "Concluido", owner: "Escola Estadual", updated: "2022" },
      { name: "Superior", status: "Em andamento", owner: "Faculdade", updated: "Hoje" }
    ]
  }),
  professionalCourses: content({
    eyebrow: "Profissional",
    title: "Cursos e certificados",
    description: "Cursos livres, certificacoes, anexos e validade para cruzamento com requisitos obrigatorios.",
    formTitle: "Adicionar curso",
    formFields: ["Nome", "Instituicao", "Carga horaria", "Certificado"],
    rows: [
      { name: "NR-10", status: "Valido", owner: "SENAI", updated: "Hoje" },
      { name: "Excel intermediario", status: "Concluido", owner: "Escola Online", updated: "Ontem" },
      { name: "Lean manufacturing", status: "Concluido", owner: "Parceiro", updated: "2025" }
    ]
  }),
  professionalSkills: content({
    eyebrow: "Profissional",
    title: "Competencias",
    description: "Competencias tecnicas e comportamentais ponderadas pelo algoritmo de compatibilidade.",
    formTitle: "Adicionar competencia",
    formFields: ["Nome", "Tipo", "Nivel", "Comprovacao"],
    rows: [
      { name: "Excel", status: "Tecnica", owner: "Nivel 4", updated: "Hoje" },
      { name: "Metrologia", status: "Tecnica", owner: "Nivel 3", updated: "Ontem" },
      { name: "Comunicacao", status: "Comportamental", owner: "Nivel 5", updated: "Hoje" }
    ]
  }),
  professionalCompatibility: content({
    eyebrow: "Profissional",
    title: "Compatibilidade",
    description: "Score de compatibilidade, motivos da pontuacao, oportunidades compativeis e competencias faltantes para melhorar a aderencia do perfil.",
    formTitle: "Refinar oportunidades",
    formFields: ["Cargo desejado", "Cidade", "Modalidade", "Disponibilidade"],
    rows: [
      { name: "Analista de PCP", status: "88 pontos", owner: "Motivo: cursos e experiencia", updated: "Hoje" },
      { name: "Assistente Fiscal", status: "74 pontos", owner: "Motivo: localidade compativel", updated: "Ontem" },
      { name: "Tecnico mecanico", status: "61 pontos", owner: "Melhorar certificacoes", updated: "3 dias" }
    ],
    actions: [{ label: "Atualizar perfil", tone: "primary" }]
  }),
  professionalResume: content({
    eyebrow: "Profissional",
    title: "Curriculo",
    description: "Geracao de PDF A4 sob demanda, cache em Storage e invalidacao automatica ao alterar o perfil.",
    formTitle: "Gerar curriculo",
    formFields: ["Modelo", "Idioma", "Resumo", "Versao"],
    rows: [
      { name: "Curriculo gerado", status: "Ativo", owner: "Sistema", updated: "Hoje" },
      { name: "Curriculo enviado", status: "Opcional", owner: "Usuario", updated: "Nao enviado" },
      { name: "Cache PDF", status: "Valido", owner: "Storage", updated: "Hoje" }
    ]
  }),
  professionalProcesses: content({
    eyebrow: "Profissional",
    title: "Processos",
    description: "Acompanhamento privado dos encaminhamentos, com status relevante e sem revelar dados restritos antes da liberacao.",
    formTitle: "Filtrar processos",
    formFields: ["Status", "Periodo", "Tipo", "Localidade"],
    rows: [
      { name: "Processo 0001", status: "Triagem", owner: "Admin", updated: "Hoje" },
      { name: "Processo 0002", status: "Treinamento", owner: "Admin", updated: "Ontem" },
      { name: "Processo 0003", status: "Encaminhado", owner: "Admin", updated: "Maio" }
    ],
    actions: [{ label: "Exportar historico", tone: "neutral" }]
  }),
  professionalNotifications: content({
    eyebrow: "Profissional",
    title: "Notificacoes",
    description: "Avisos internos, status de processo, suporte, emails transacionais e marcacao de leitura.",
    formTitle: "Preferencias",
    formFields: ["Email", "Push interno", "Processos", "Suporte"],
    rows: [
      { name: "Status atualizado", status: "Nao lida", owner: "Sistema", updated: "Hoje" },
      { name: "Perfil aprovado", status: "Lida", owner: "Sistema", updated: "Ontem" },
      { name: "Resposta suporte", status: "Lida", owner: "Suporte", updated: "Maio" }
    ],
    actions: [{ label: "Marcar todas como lidas", tone: "primary" }]
  }),
  professionalDevelopment: content({
    eyebrow: "Profissional",
    title: "Desenvolvimento",
    description: "Cursos sugeridos, competencias faltantes e melhorias recomendadas com base nas oportunidades compativeis.",
    formTitle: "Plano de melhoria",
    formFields: ["Competencia", "Curso sugerido", "Prioridade", "Prazo"],
    rows: [
      { name: "Excel intermediario", status: "Sugerido", owner: "Alta prioridade", updated: "Hoje" },
      { name: "NR-10", status: "Certificacao faltante", owner: "Media prioridade", updated: "Ontem" },
      { name: "Comunicacao", status: "Melhoria recomendada", owner: "Baixa prioridade", updated: "3 dias" }
    ],
    actions: [{ label: "Montar plano", tone: "primary" }]
  }),
  professionalSupport: content({
    eyebrow: "Profissional",
    title: "Suporte",
    description: "Canal de atendimento com categorias, anexos, protocolo e reabertura em ate 7 dias.",
    formTitle: "Abrir chamado",
    formFields: ["Titulo", "Categoria", "Descricao", "Anexo"],
    rows: [
      { name: "PT-2026-0120", status: "Aberto", owner: "Usuario", updated: "Hoje" },
      { name: "PT-2026-0118", status: "Resolvido", owner: "Admin", updated: "Ontem" },
      { name: "PT-2026-0104", status: "Fechado", owner: "Admin", updated: "Maio" }
    ]
  })
} satisfies Record<string, PageContent>;
