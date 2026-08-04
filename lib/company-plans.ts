export const COMPANY_PLAN_CODES = ["essential", "professional", "vip"] as const;

export type CompanyPlanCode = (typeof COMPANY_PLAN_CODES)[number];

export type CompanyPlan = {
  code: CompanyPlanCode;
  name: string;
  eyebrow: string;
  monthlyPrice: string;
  hiringFee: string;
  description: string;
  benefits: string[];
  featured?: boolean;
};

export const COMPANY_PLANS: CompanyPlan[] = [
  {
    code: "essential",
    name: "Essencial",
    eyebrow: "Para começar",
    monthlyPrice: "R$ 0",
    hiringFee: "R$ 99",
    description: "Comece a contratar sem mensalidade fixa.",
    benefits: ["Risco zero para pequenos negócios", "Acompanhamento de demandas e candidatos", "Taxa somente por contratação confirmada"]
  },
  {
    code: "professional",
    name: "Profissional",
    eyebrow: "Para contratar mais",
    monthlyPrice: "R$ 199",
    hiringFee: "R$ 299",
    description: "Mais autonomia para manter seu recrutamento em movimento.",
    benefits: ["Acesso ao banco de dados de profissionais", "Vagas ilimitadas", "Visão completa dos processos seletivos"]
  },
  {
    code: "vip",
    name: "Portal VIP",
    eyebrow: "Atendimento prioritário",
    monthlyPrice: "R$ 299",
    hiringFee: "R$ 199 ou R$ 149",
    description: "Prioridade, curadoria e melhores condições por contratação.",
    benefits: ["Alertas VIP em tempo real", "Curadoria para suas demandas", "Desconto por contratação efetivada"],
    featured: true
  }
];

export function isCompanyPlanCode(value: string): value is CompanyPlanCode {
  return COMPANY_PLAN_CODES.includes(value as CompanyPlanCode);
}

export function getCompanyPlan(code: string | null | undefined) {
  return COMPANY_PLANS.find((plan) => plan.code === code) ?? COMPANY_PLANS[0];
}
