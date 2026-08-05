import "server-only";

import { getDocumentProxy } from "unpdf";

export type ImportedEducation = {
  level: "fundamental" | "medio" | "tecnico" | "superior" | "pos" | "mba" | "mestrado" | "doutorado";
  institution: string;
  courseName: string;
  completedAt: string | null;
};

export type ImportedExperience = {
  companyName: string;
  roleTitle: string;
  description: string;
  startedAt: string;
  endedAt: string | null;
  isCurrent: boolean;
};

export type ImportedCourse = {
  name: string;
  institution: string | null;
  workloadHours: number | null;
  completedAt: string | null;
};

export type ImportedResume = {
  desiredRole: string | null;
  summary: string | null;
  educations: ImportedEducation[];
  experiences: ImportedExperience[];
  courses: ImportedCourse[];
  skills: string[];
  languages: Array<{ name: string; proficiency: string }>;
  extractedCharacters: number;
};

type PdfTextItem = { str: string; transform: number[]; hasEOL?: boolean };

function isPdfTextItem(value: unknown): value is PdfTextItem {
  return Boolean(value && typeof value === "object" && "str" in value && "transform" in value);
}

async function extractPdfLines(pdf: Awaited<ReturnType<typeof getDocumentProxy>>) {
  const lines: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    let currentLine: string[] = [];
    let currentY: number | null = null;
    for (const rawItem of content.items) {
      if (!isPdfTextItem(rawItem) || !rawItem.str.trim()) continue;
      const y = Number(rawItem.transform[5] ?? 0);
      if (currentY !== null && Math.abs(currentY - y) > 2 && currentLine.length) {
        lines.push(currentLine.join(" "));
        currentLine = [];
      }
      currentLine.push(rawItem.str);
      currentY = y;
      if (rawItem.hasEOL && currentLine.length) {
        lines.push(currentLine.join(" "));
        currentLine = [];
        currentY = null;
      }
    }
    if (currentLine.length) lines.push(currentLine.join(" "));
  }
  return lines;
}

const headingAliases: Record<string, string[]> = {
  objective: ["objetivo", "objetivo profissional", "cargo pretendido", "area de interesse"],
  summary: ["resumo", "resumo profissional", "perfil profissional", "sobre mim"],
  experiences: ["experiencia", "experiencias", "experiencia profissional", "historico profissional"],
  education: ["formacao", "formacao academica", "escolaridade", "historico academico"],
  courses: ["cursos", "cursos e qualificacoes", "qualificacoes", "certificacoes", "treinamentos"],
  skills: ["habilidades", "competencias", "conhecimentos", "especialidades"],
  languages: ["idiomas", "linguas"]
};

function plain(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function cleanLine(value: string) {
  return value.replace(/[•●▪◦]/g, " ").replace(/\s+/g, " ").replace(/^[-–—|:;]+|[-–—|:;]+$/g, "").trim();
}

function sectionKey(line: string) {
  const normalized = plain(line);
  for (const [key, aliases] of Object.entries(headingAliases)) {
    if (aliases.includes(normalized)) return key;
  }
  return null;
}

function splitSections(lines: string[]) {
  const sections = new Map<string, string[]>();
  let current = "header";
  sections.set(current, []);

  for (const line of lines) {
    const key = sectionKey(line);
    if (key) {
      current = key;
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }
    sections.get(current)?.push(line);
  }
  return sections;
}

function parseDateToken(value: string | undefined, endOfPeriod = false) {
  if (!value) return null;
  const normalized = plain(value);
  if (/atual|presente|momento/.test(normalized)) return null;

  const full = value.match(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/);
  if (full) return `${full[3]}-${full[2].padStart(2, "0")}-${full[1].padStart(2, "0")}`;

  const monthYear = value.match(/\b(0?[1-9]|1[0-2])[/.](19\d{2}|20\d{2})\b/);
  if (monthYear) return `${monthYear[2]}-${monthYear[1].padStart(2, "0")}-01`;

  const year = value.match(/\b(19\d{2}|20\d{2})\b/);
  return year ? `${year[1]}-${endOfPeriod ? "12-31" : "01-01"}` : null;
}

function dateRange(value: string) {
  const current = /atual|presente|momento/i.test(value);
  const tokens = value.match(/(?:\d{1,2}[/.])?\d{4}|atual|presente|momento/gi) ?? [];
  const startedAt = parseDateToken(tokens[0]);
  const endedAt = current ? null : parseDateToken(tokens[1], true);
  return startedAt ? { startedAt, endedAt, isCurrent: current } : null;
}

function likelyContact(line: string) {
  return /@|https?:|linkedin|\b(?:cpf|telefone|celular|endereco|e-mail|email)\b/i.test(line) || /\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4}/.test(line);
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = plain(value);
    if (key.length < 2 || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseExperiences(lines: string[]): ImportedExperience[] {
  const items: ImportedExperience[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const range = dateRange(lines[index]);
    if (!range) continue;
    const previous = lines.slice(Math.max(0, index - 2), index).filter(Boolean);
    const roleTitle = previous.at(-1) ?? "Função informada no currículo";
    const companyName = previous.at(-2) ?? "Empresa informada no currículo";
    const description: string[] = [];
    for (let cursor = index + 1; cursor < lines.length && !dateRange(lines[cursor]); cursor += 1) {
      if (!sectionKey(lines[cursor])) description.push(lines[cursor]);
    }
    items.push({
      companyName: companyName.slice(0, 180),
      roleTitle: roleTitle.slice(0, 180),
      description: (description.join(" ") || "Experiência importada do currículo anexado.").slice(0, 2000),
      ...range
    });
  }
  return items.filter((item, index, all) => all.findIndex((other) => plain(other.companyName) === plain(item.companyName) && plain(other.roleTitle) === plain(item.roleTitle) && other.startedAt === item.startedAt) === index);
}

function educationLevel(value: string): ImportedEducation["level"] {
  const normalized = plain(value);
  if (normalized.includes("doutor")) return "doutorado";
  if (normalized.includes("mestr")) return "mestrado";
  if (normalized.includes("mba")) return "mba";
  if (normalized.includes("pos") || normalized.includes("especializa")) return "pos";
  if (normalized.includes("superior") || normalized.includes("gradu") || normalized.includes("bacharel") || normalized.includes("licencia")) return "superior";
  if (normalized.includes("tecnic")) return "tecnico";
  if (normalized.includes("fundamental")) return "fundamental";
  return "medio";
}

function parseEducations(lines: string[]): ImportedEducation[] {
  const groups: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (current.length >= 2 && /\b(?:19|20)\d{2}\b/.test(line)) {
      current.push(line);
      groups.push(current);
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length) groups.push(current);

  return groups
    .filter((group) => group.length >= 2)
    .map((group) => ({
      level: educationLevel(group.join(" ")),
      courseName: (group[0] ?? "Formação informada no currículo").slice(0, 180),
      institution: (group[1] ?? "Instituição informada no currículo").slice(0, 180),
      completedAt: parseDateToken(group.find((line) => /\b(?:19|20)\d{2}\b/.test(line)), true)
    }));
}

function parseCourses(lines: string[]): ImportedCourse[] {
  return lines
    .map((line) => line.split(/\s+[|–—-]\s+|\s{2,}|;/).map(cleanLine).filter(Boolean))
    .filter((parts) => parts.length > 0)
    .map((parts) => {
      const joined = parts.join(" ");
      const workload = joined.match(/\b(\d{1,4})\s*(?:h|horas?)\b/i);
      return {
        name: parts[0].slice(0, 180),
        institution: parts[1] && !/\b(?:19|20)\d{2}\b/.test(parts[1]) ? parts[1].slice(0, 180) : null,
        workloadHours: workload ? Number(workload[1]) : null,
        completedAt: parseDateToken(joined, true)
      };
    });
}

function parseLanguages(lines: string[]) {
  return lines.map((line) => {
    const parts = line.split(/\s+[|–—-]\s+|:|;/).map(cleanLine).filter(Boolean);
    return { name: parts[0]?.slice(0, 80) ?? "", proficiency: (parts.slice(1).join(" ") || "Informado no currículo").slice(0, 80) };
  }).filter((item) => item.name.length > 1);
}

export async function extractResumeFromPdf(buffer: ArrayBuffer): Promise<ImportedResume> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  if (pdf.numPages > 30) throw new Error("O currículo possui páginas demais para importação automática.");
  const extractedLines = await Promise.race([
    extractPdfLines(pdf),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Tempo limite ao ler o currículo.")), 15_000))
  ]);
  const lines = extractedLines.map(cleanLine).filter((line) => line.length > 1);
  const rawText = lines.join("\n");
  if (lines.join("").length < 40) throw new Error("O PDF não possui texto legível para preenchimento automático.");

  const sections = splitSections(lines);
  const header = sections.get("header") ?? [];
  const objective = sections.get("objective") ?? [];
  const summaryLines = sections.get("summary") ?? [];
  const desiredRole = objective.find((line) => !likelyContact(line)) ?? header.slice(1, 6).find((line) => !likelyContact(line) && line.length < 100) ?? null;
  const summary = summaryLines.length ? summaryLines.join(" ").slice(0, 3000) : objective.slice(1).join(" ").slice(0, 3000) || null;
  const skillLines = sections.get("skills") ?? [];
  const skills = uniqueStrings(skillLines.flatMap((line) => line.split(/[,;|]/).map(cleanLine))).slice(0, 40);

  return {
    desiredRole: desiredRole?.slice(0, 180) ?? null,
    summary,
    educations: parseEducations(sections.get("education") ?? []).slice(0, 20),
    experiences: parseExperiences(sections.get("experiences") ?? []).slice(0, 30),
    courses: parseCourses(sections.get("courses") ?? []).slice(0, 30),
    skills,
    languages: parseLanguages(sections.get("languages") ?? []).slice(0, 15),
    extractedCharacters: rawText.length
  };
}
