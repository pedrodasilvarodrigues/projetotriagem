export type EducationLevel = "fundamental" | "medio" | "tecnico" | "superior" | "pos" | "mba" | "mestrado" | "doutorado";

export type DemandScoringInput = {
  educationMinimum: EducationLevel;
  requiredCourses: string[];
  requiredCertifications: string[];
  requiredTechnicalSkills: string[];
  city: string;
  state: string;
  modality: "presencial" | "hibrido" | "remoto";
  minimumExperienceMonths: number;
};

export type ProfessionalScoringInput = {
  educationLevel: EducationLevel;
  courses: string[];
  certifications: string[];
  certificationSkillTags?: string[];
  technicalSkills: string[];
  city: string;
  state: string;
  availableInDays: number;
  experienceMonths: number;
};

const educationRank: Record<EducationLevel, number> = {
  fundamental: 1,
  medio: 2,
  tecnico: 3,
  superior: 4,
  pos: 5,
  mba: 6,
  mestrado: 7,
  doutorado: 8
};

function normalizeList(values: string[]) {
  return values.map((value) => value.trim().toLocaleLowerCase("pt-BR")).filter(Boolean);
}

function matchPercent(required: string[], owned: string[]) {
  const normalizedRequired = normalizeList(required);
  if (normalizedRequired.length === 0) return 1;
  const ownedSet = new Set(normalizeList(owned));
  return normalizedRequired.filter((item) => ownedSet.has(item)).length / normalizedRequired.length;
}

const CERTIFICATION_BONUS_PER_MATCH = 20;
const CERTIFICATION_BONUS_CAP = 30;

function certificationBonus(demand: DemandScoringInput, professional: ProfessionalScoringInput) {
  const demandTags = normalizeList([...demand.requiredCourses, ...demand.requiredCertifications, ...demand.requiredTechnicalSkills]);
  if (demandTags.length === 0) return 0;
  const ownedTags = new Set(normalizeList(professional.certificationSkillTags ?? []));
  const matches = demandTags.filter((tag) => ownedTags.has(tag)).length;
  return Math.min(CERTIFICATION_BONUS_CAP, matches * CERTIFICATION_BONUS_PER_MATCH);
}

export function calculateCompatibilityScore(demand: DemandScoringInput, professional: ProfessionalScoringInput) {
  const minimumRank = educationRank[demand.educationMinimum];
  const professionalRank = educationRank[professional.educationLevel];
  const education = professionalRank < minimumRank ? 0 : professionalRank === minimumRank ? 0.6 : 1;
  const experience = demand.minimumExperienceMonths === 0 ? 1 : Math.min(professional.experienceMonths / demand.minimumExperienceMonths, 1);
  const coursesAndCerts = matchPercent([...demand.requiredCourses, ...demand.requiredCertifications], [...professional.courses, ...professional.certifications]);
  const technicalSkills = matchPercent(demand.requiredTechnicalSkills, professional.technicalSkills);
  const sameCity = demand.city.toLocaleLowerCase("pt-BR") === professional.city.toLocaleLowerCase("pt-BR");
  const sameState = demand.state.toLocaleLowerCase("pt-BR") === professional.state.toLocaleLowerCase("pt-BR");
  const location = sameCity ? 1 : sameState ? 0.6 : demand.modality === "remoto" ? 0.8 : 0;
  const availability = professional.availableInDays === 0 ? 1 : Math.max(0, 1 - professional.availableInDays / 60);

  const baseScore = Math.round((education * 20 + experience * 25 + coursesAndCerts * 20 + technicalSkills * 20 + location * 10 + availability * 5) * 100) / 100;
  return Math.min(100, baseScore + certificationBonus(demand, professional));
}
