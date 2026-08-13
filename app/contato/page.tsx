import { BarChart3, Lightbulb, MessageSquareText, ShieldCheck, Star } from "lucide-react";
import { PublicPageShell } from "@/components/app/public-page-shell";
import { PORTAL_FEEDBACK_URL } from "@/lib/feedback";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata({
  title: "Contato",
  description: "Entre em contato com o Portal Encaixe para tirar dúvidas sobre cadastro, currículos, empresas, vagas e acompanhamento de processos.",
  path: "/contato"
});

const feedbackTypes = [
  {
    title: "Avalie sua experiência",
    text: "Conte como foi usar o Portal Encaixe e dê uma nota para a experiência.",
    icon: Star
  },
  {
    title: "Envie uma sugestão",
    text: "Compartilhe uma ideia que possa deixar a plataforma mais clara, completa ou funcional.",
    icon: Lightbulb
  },
  {
    title: "Relate um problema",
    text: "Descreva o que aconteceu para que a equipe consiga identificar e priorizar a correção.",
    icon: MessageSquareText
  }
];

export default function ContactPage() {
  return (
    <PublicPageShell
      eyebrow="Contato"
      title="Sua experiência ajuda o Portal Encaixe a evoluir."
      description="Avaliações, sugestões e relatos de problemas são organizados em uma plataforma própria para que a equipe possa analisar cada contribuição com mais atenção."
      primaryAction={{ href: PORTAL_FEEDBACK_URL, label: "Ir para avaliações e feedback" }}
      secondaryAction={null}
      hideHeaderActions
      asideTitle="Tudo em um só lugar"
      asideItems={[
        "Envie avaliações, sugestões ou problemas.",
        "As contribuições ficam organizadas para análise.",
        "Você não precisa enviar ou acompanhar e-mails."
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {feedbackTypes.map((item) => (
          <article key={item.title} className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F2811D]/40 hover:shadow-xl">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#F2811D]/10 text-[#F2811D] transition group-hover:bg-[#F2811D] group-hover:text-white">
              <item.icon aria-hidden="true" size={23} />
            </span>
            <h2 className="mt-5 font-display text-xl font-extrabold text-[#0F2D4E]">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
          </article>
        ))}
      </div>

      <section className="mt-10 overflow-hidden rounded-[2rem] bg-[#0F2D4E] text-white shadow-2xl shadow-[#0F2D4E]/15">
        <div className="grid gap-8 p-7 md:p-9 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
          <div>
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#F2811D] text-white shadow-lg shadow-orange-950/20">
              <ShieldCheck aria-hidden="true" size={24} />
            </span>
            <h2 className="mt-5 font-display text-2xl font-extrabold">Feedback separado, análise mais organizada.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">
              A página externa foi criada exclusivamente para receber opiniões sobre o Portal Encaixe. Assim cada avaliação fica registrada e pode ser analisada sem depender de uma caixa de e-mail.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
            <BarChart3 aria-hidden="true" className="text-[#F2811D]" size={26} />
            <strong className="mt-4 block font-display text-lg">Sua opinião vira melhoria</strong>
            <p className="mt-2 text-sm leading-6 text-slate-300">Quanto mais claro for o relato, mais fácil será entender a prioridade e melhorar a experiência.</p>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
