export function scoreClassification(score: number) {
  if (score >= 85) return { label: "Excelente", color: "var(--success)" };
  if (score >= 70) return { label: "Alta", color: "var(--primary)" };
  if (score >= 50) return { label: "Média", color: "var(--warning)" };
  return { label: "Baixa", color: "var(--danger)" };
}
