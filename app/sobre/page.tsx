import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, ClipboardCheck, FileText, SearchCheck, ShieldCheck, UserRoundCheck, type LucideIcon } from "lucide-react";
import { PublicPageShell } from "@/components/app/public-page-shell";

type InfoCard = {
  title: string;
  text: string;
  icon: LucideIcon;
};

const pillars: InfoCard[] = [
  {
    title: "Currículo que trabalha por você",
    text: "O profissional organiza dados, objetivo, experiências, cursos e documentos em um perfil claro para triagem.",
    icon: FileText
  },
  {
    title: "Compatibilidade com critério",
    text: "As demandas são analisadas com localização, objetivo profissional, formação e aderência ao perfil solicitado.",
    icon: SearchCheck
  },
  {
    title: "Encaminhamento acompanhado",
    text: "A plataforma evita o envio solto de currículos: existe fluxo, histórico e validação antes da apresentação.",
    icon: ClipboardCheck
  }
];

const reasons = [
  "Não é apenas um mural de vagas: existe triagem e acompanhamento.",
  "Seu currículo fica pronto para oportunidades atuais e futuras.",
  "Empresas recebem profissionais apresentados pela administração.",
  "Você mantém seus dados organizados em um ambiente único."
];

const ecosystemCards: InfoCard[] = [
  { title: "Profissional", text: "Cria currículo, acompanha status e recebe encaminhamentos.", icon: UserRoundCheck },
  { title: "Empresa", text: "Registra demandas e visualiza candidatos apresentados.", icon: BriefcaseBusiness },
  { title: "Administração", text: "Analisa compatibilidade, triagem e apresentações.", icon: ShieldCheck },
  { title: "Processo", text: "Mantém histórico do ciclo até entrevista ou contratação.", icon: CheckCircle2 }
];

export default function AboutPage() {
  return (
    <PublicPageShell
      eyebrow="Sobre o Portal"
      title="Um banco de talentos com triagem, contexto e encaminhamento real."
      description="O Portal Encaixe foi criado para aproximar profissionais e empresas com mais organização: o currículo deixa de ser um arquivo perdido e passa a fazer parte de uma jornada de compatibilidade e apresentação qualificada."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {pillars.map((item) => (
          <article key={item.title} className="group rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F2811D]/40 hover:shadow-2xl hover:shadow-[#0F2D4E]/8">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#F2811D]/10 text-[#F2811D] transition group-hover:bg-[#F2811D] group-hover:text-white">
              <item.icon aria-hidden="true" size={22} />
            </span>
            <h2 className="mt-5 font-display text-xl font-extrabold text-[#0F2D4E]">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
          </article>
        ))}
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-[2rem] bg-[#0F2D4E] p-7 text-white shadow-2xl shadow-[#0F2D4E]/20">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#F2811D]">Para profissionais</p>
          <h2 className="mt-4 font-display text-3xl font-extrabold">Cadastre seu currículo antes da oportunidade aparecer.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-200">
            Quando uma demanda chega, o perfil completo ajuda a plataforma a identificar aderência com mais velocidade e menos ruído.
          </p>
          <Link href="/register" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#F2811D] px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#F5A24D]">
            Começar meu cadastro
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            {ecosystemCards.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-100 bg-[#FAFBFC] p-4">
                <item.icon aria-hidden="true" className="text-[#F2811D]" size={21} />
                <strong className="mt-3 block text-sm font-extrabold text-[#0F2D4E]">{item.title}</strong>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-[2rem] border border-[#F2811D]/20 bg-[#F2811D]/8 p-7">
        <h2 className="font-display text-2xl font-extrabold text-[#0F2D4E]">Por que vale cadastrar agora?</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {reasons.map((reason) => (
            <p key={reason} className="flex gap-3 rounded-2xl bg-white/75 p-4 text-sm font-semibold text-slate-700">
              <CheckCircle2 aria-hidden="true" className="shrink-0 text-[#F2811D]" size={18} />
              {reason}
            </p>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
}
