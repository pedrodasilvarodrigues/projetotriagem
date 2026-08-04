const labels: Record<string, string> = {
  active: "Ativo",
  approved: "Aprovado",
  archived: "Arquivado",
  awaiting_professional_confirmation: "Aguardando confirmação profissional",
  cancelled: "Cancelado",
  closed: "Encerrado",
  completed: "Concluído",
  denied: "Negado",
  draft: "Rascunho",
  forwarded: "Apresentado",
  hire_dispute: "Divergência em análise",
  hired: "Contratado",
  interview: "Entrevista",
  pending: "Pendente",
  presented: "Apresentado",
  pre_approved: "Aprovado",
  processing: "Em processamento",
  received: "Recebido",
  rejected: "Reprovado",
  requested: "Solicitado",
  screening: "Em triagem",
  sent: "Enviado",
  suspended: "Suspenso",
  training: "Treinamento",
  waiting: "Em espera"
};

export function statusLabel(status?: string | null) {
  if (!status) return "Não informado";
  return labels[status] ?? status.replaceAll("_", " ");
}

export function requestTypeLabel(type?: string | null) {
  const requestTypes: Record<string, string> = {
    account_deletion: "Exclusão da conta",
    export: "Exportação dos dados",
    partial_anonymization: "Anonimização parcial"
  };
  return type ? requestTypes[type] ?? type.replaceAll("_", " ") : "Não informado";
}
