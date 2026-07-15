import Link from "next/link";
import { ArrowRight, Bell, BriefcaseBusiness, CheckCircle2, ClipboardCheck, FileSearch, Send, UserRoundCheck, type LucideIcon } from "lucide-react";
import { PublicPageShell } from "@/components/app/public-page-shell";

type FlowCard = {
  title: string;
  text: string;
  icon: LucideIcon;
};

const steps: FlowCard[] = [
  {
    title: "Você cadastra seu perfil",
    text: "Informe dados pessoais, objetivo, cidade, experiências, formação, cursos e anexe ou gere seu currículo.",
    icon: UserRoundCheck
  },
  {
    title: "A plataforma organiza seu currículo",
    text: "Seu perfil fica estruturado para busca interna, triagem e futuras oportunidades compatíveis.",
    icon: FileSearch
  },
  {
    title: "Demandas entram no sistema",
    text: "Empresas cadastradas registram necessidades reais com cargo, cidade, requisitos e observações.",
    icon: BriefcaseBusiness
  },
  {
    title: "A triagem analisa compatibilidade",
    text: "A administração avalia aderência e decide quem será apresentado ou ficará em fila reserva.",
    icon: ClipboardCheck
  },
  {
    title: "Você acompanha os encaminhamentos",
    text: "Quando houver avanço, o portal registra situação, histórico e próximos passos do processo.",
    icon: Send
  }
];

const benefits: FlowCard[] = [
  { title: "Transparência", text: "Você entende onde seu perfil entra e acompanha a situação pelo portal.", icon: Bell },
  { title: "Critério", text: "As apresentações não são aleatórias: dependem de demanda, perfil e validação.", icon: CheckCircle2 },
  { title: "Ação", text: "Quanto mais completo o currículo, melhor a análise de compatibilidade.", icon: ClipboardCheck }
];

export default function HowItWorksPage() {
  return (
    <PublicPageShell
      eyebrow="Como funciona"
      title="Do currículo ao encaminhamento, cada etapa tem uma lógica."
      description="O Portal Encaixe não promete vaga automática. Ele organiza o perfil profissional, cruza informações com demandas e permite que a administração apresente candidatos com mais precisão."
    >
      <ol className="relative grid gap-5">
        {steps.map((step, index) => (
          <li key={step.title} className="group grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F2811D]/40 hover:shadow-xl md:grid-cols-[72px_minmax(0,1fr)_120px] md:items-center">
            <div className="flex items-center gap-4 md:block">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-[#0F2D4E] text-white shadow-lg shadow-[#0F2D4E]/15 transition group-hover:bg-[#F2811D]">
                <step.icon aria-hidden="true" size={24} />
              </span>
              <span className="font-display text-3xl font-extrabold text-[#F2811D] md:mt-3 md:block">0{index + 1}</span>
            </div>
            <div>
              <h2 className="font-display text-xl font-extrabold text-[#0F2D4E]">{step.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{step.text}</p>
            </div>
            <span className="hidden rounded-full border border-[#F2811D]/20 bg-[#F2811D]/10 px-3 py-2 text-center text-xs font-extrabold uppercase tracking-wide text-[#B5520C] md:inline-flex md:justify-center">
              Etapa {index + 1}
            </span>
          </li>
        ))}
      </ol>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        {benefits.map((item) => (
          <article key={item.title} className="rounded-[1.5rem] border border-slate-200 bg-[#FAFBFC] p-5">
            <item.icon aria-hidden="true" className="text-[#F2811D]" size={23} />
            <h3 className="mt-4 font-display text-lg font-extrabold text-[#0F2D4E]">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-[2rem] bg-[#0F2D4E] p-7 text-white md:flex md:items-center md:justify-between md:gap-8">
        <div>
          <h2 className="font-display text-2xl font-extrabold">Quer entrar na triagem?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-200">Crie seu cadastro profissional e deixe seu currículo pronto para as próximas demandas.</p>
        </div>
        <Link href="/register" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#F2811D] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#F5A24D] md:mt-0">
          Cadastrar currículo
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
      </section>
    </PublicPageShell>
  );
}
