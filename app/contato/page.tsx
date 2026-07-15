import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Clock, HelpCircle, Mail, MessageCircle, UserRoundCheck, type LucideIcon } from "lucide-react";
import { PublicPageShell } from "@/components/app/public-page-shell";

type ContactCard = {
  title: string;
  text: string;
  action?: string;
  href?: string;
  icon: LucideIcon;
};

const channels: Required<Pick<ContactCard, "title" | "text" | "action" | "href" | "icon">>[] = [
  {
    title: "Sou profissional",
    text: "Cadastre seu currículo, mantenha seus dados atualizados e acompanhe encaminhamentos pela área profissional.",
    action: "Cadastrar currículo",
    href: "/register",
    icon: UserRoundCheck
  },
  {
    title: "Sou empresa",
    text: "Crie uma conta empresarial para registrar demandas e receber profissionais apresentados pela administração.",
    action: "Cadastrar empresa",
    href: "/register",
    icon: BriefcaseBusiness
  },
  {
    title: "Já tenho acesso",
    text: "Entre no portal para consultar seu perfil, demandas, processos, notificações e histórico de triagem.",
    action: "Entrar no portal",
    href: "/login",
    icon: MessageCircle
  }
];

const checklist: ContactCard[] = [
  { title: "Complete seu currículo", text: "Dados incompletos reduzem a precisão da triagem.", icon: UserRoundCheck },
  { title: "Verifique sua área logada", text: "Processos, encaminhamentos e avisos aparecem no portal.", icon: Clock },
  { title: "Use o cadastro correto", text: "Profissional e empresa possuem fluxos diferentes.", icon: HelpCircle }
];

export default function ContactPage() {
  return (
    <PublicPageShell
      eyebrow="Contato"
      title="Fale com o Portal Encaixe pelo caminho certo."
      description="Se você quer cadastrar currículo, registrar uma demanda ou acompanhar um processo, o portal centraliza os próximos passos para reduzir ruído e acelerar a triagem."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {channels.map((channel) => (
          <article key={channel.title} className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F2811D]/40 hover:shadow-xl">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#F2811D]/10 text-[#F2811D] transition group-hover:bg-[#F2811D] group-hover:text-white">
              <channel.icon aria-hidden="true" size={23} />
            </span>
            <h2 className="mt-5 font-display text-xl font-extrabold text-[#0F2D4E]">{channel.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{channel.text}</p>
            <Link href={channel.href} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#F2811D] transition hover:text-[#B5520C]">
              {channel.action}
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </article>
        ))}
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-[2rem] bg-[#0F2D4E] p-7 text-white">
          <Mail aria-hidden="true" className="text-[#F2811D]" size={28} />
          <h2 className="mt-4 font-display text-2xl font-extrabold">Atendimento organizado por prioridade.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            Para suporte de acesso, atualização cadastral ou dúvidas sobre triagem, entre pelo portal quando possível. Isso mantém histórico e evita perda de informações.
          </p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/8 p-4 text-sm text-slate-200">
            <strong className="block text-white">Dica rápida</strong>
            Se ainda não tem conta, o primeiro passo é cadastrar seu currículo. Assim a equipe tem dados suficientes para avaliar compatibilidade.
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-7">
          <h2 className="font-display text-2xl font-extrabold text-[#0F2D4E]">Antes de falar com a equipe</h2>
          <div className="mt-5 space-y-4">
            {checklist.map((item) => (
              <div key={item.title} className="flex gap-4 rounded-2xl bg-[#FAFBFC] p-4">
                <item.icon aria-hidden="true" className="mt-0.5 shrink-0 text-[#F2811D]" size={22} />
                <div>
                  <strong className="block text-sm font-extrabold text-[#0F2D4E]">{item.title}</strong>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
