import type { CompanyPlan } from "@/lib/companies/plan-access";

export type SelectableCompanyPlan = Exclude<CompanyPlan, "nenhum">;

type PlanDefinition = {
  id: SelectableCompanyPlan;
  name: string;
  monthlyPrice: string;
  hiringFee: string;
  description: string;
  benefits: string[];
  featured?: boolean;
};

function commercialValue(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

export const companyPlans: PlanDefinition[] = [
  {
    id: "essencial",
    name: "Essencial",
    monthlyPrice: "R$ 0",
    hiringFee: commercialValue(process.env.NEXT_PUBLIC_ESSENTIAL_HIRING_FEE, "Taxa aplicada somente na contratação"),
    description: "O fluxo conduzido pela curadoria, com uma apresentação por vez.",
    benefits: ["Cadastro e gestão de demandas", "Apresentação individual pela curadoria", "Acompanhamento do processo no portal"]
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: commercialValue(process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE, "Condição comercial"),
    hiringFee: commercialValue(process.env.NEXT_PUBLIC_PRO_HIRING_FEE, "Taxa definida na proposta"),
    description: "Mais autonomia para encontrar e comparar profissionais elegíveis.",
    benefits: ["Tudo do plano Essencial", "Vitrine protegida de profissionais", "Shortlist de até 10 candidatos por demanda"],
    featured: true
  },
  {
    id: "vip",
    name: "Acesso VIP Total",
    monthlyPrice: commercialValue(process.env.NEXT_PUBLIC_VIP_MONTHLY_PRICE, "Condição comercial"),
    hiringFee: commercialValue(process.env.NEXT_PUBLIC_VIP_HIRING_FEE, "Taxa definida na proposta"),
    description: "Atendimento prioritário para operações com maior volume e cadência.",
    benefits: ["Tudo do plano Pro", "Prioridade no acompanhamento", "Apoio operacional dedicado"]
  }
];

export function companyPlanDefinition(plan: CompanyPlan) {
  return companyPlans.find((item) => item.id === plan);
}

export function companyPlanContactHref(input: { companyName: string; plan: SelectableCompanyPlan }) {
  const plan = companyPlanDefinition(input.plan);
  const text = `Olá, equipe do Portal Encaixe. Sou da empresa ${input.companyName} e escolhi o plano ${plan?.name ?? input.plan}. Quero concluir a ativação.`;
  const whatsapp = process.env.NEXT_PUBLIC_COMMERCIAL_WHATSAPP?.replace(/\D/g, "");

  if (whatsapp) return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
  const configuredEmail = process.env.COMMERCIAL_EMAIL || process.env.RESEND_FROM_EMAIL || "";
  const email = configuredEmail.match(/<([^>]+)>/)?.[1] || configuredEmail.trim();
  if (email.includes("@")) {
    return `mailto:${email}?subject=${encodeURIComponent(`Ativação do plano ${plan?.name ?? input.plan}`)}&body=${encodeURIComponent(text)}`;
  }
  return `/contato?assunto=${encodeURIComponent(`Ativação do plano ${plan?.name ?? input.plan}`)}&mensagem=${encodeURIComponent(text)}`;
}
