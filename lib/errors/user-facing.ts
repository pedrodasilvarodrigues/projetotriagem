const messages: Record<string, string> = {
  "capa-invalida": "Escolha uma imagem JPG, PNG ou WEBP com até 8 MB.",
  "perfil-profissional-nao-encontrado": "Não encontramos seu perfil profissional. Atualize a página e tente novamente.",
  "prestador-indisponivel": "Seu perfil de prestador não está disponível para esta alteração.",
  "operacao-nao-autorizada": "Não foi possível concluir esta alteração com sua conta. Atualize a página e tente novamente.",
  "falha-upload": "Não foi possível enviar a imagem. Verifique o arquivo e tente novamente.",
  "dados-invalidos": "Revise as informações preenchidas e tente novamente.",
  "registro-duplicado": "Esta informação já foi cadastrada.",
  "erro-temporario": "Não foi possível concluir a operação agora. Tente novamente em alguns instantes."
};

export function safeErrorCode(value: unknown) {
  const text = value instanceof Error
    ? `${value.name} ${value.message}`
    : typeof value === "object" && value && "message" in value
      ? String((value as { message?: unknown }).message ?? "")
      : String(value ?? "");
  const normalized = text.toLowerCase();

  if (normalized.includes("permission denied") || normalized.includes("row-level security") || normalized.includes("unauthorized") || normalized.includes("42501")) return "operacao-nao-autorizada";
  if (normalized.includes("storage") || normalized.includes("upload") || normalized.includes("mime") || normalized.includes("payload too large")) return "falha-upload";
  if (normalized.includes("duplicate") || normalized.includes("23505") || normalized.includes("already exists")) return "registro-duplicado";
  if (normalized.includes("invalid") || normalized.includes("constraint") || normalized.includes("23514") || normalized.includes("22p02")) return "dados-invalidos";
  return "erro-temporario";
}

export function userFacingErrorMessage(value: unknown) {
  const raw = String(value ?? "").trim();
  const decoded = (() => {
    try { return decodeURIComponent(raw); } catch { return raw; }
  })();
  return messages[decoded] ?? messages[safeErrorCode(decoded)] ?? messages["erro-temporario"];
}
