export function normalizeInstitutionName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/servico nacional de aprendizagem rural/g, "senar")
    .replace(/servico nacional de aprendizagem industrial/g, "senai")
    .replace(/servico nacional de aprendizagem comercial/g, "senac")
    .replace(/[^a-z0-9]/g, "");
}

export function cleanInstitutionName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}
