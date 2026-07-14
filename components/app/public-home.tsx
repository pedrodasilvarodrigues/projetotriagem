"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileText,
  History,
  LockKeyhole,
  Mail,
  MapPin,
  SearchCheck,
  ShieldCheck,
  TrendingUp,
  UserRoundCheck,
  type LucideIcon
} from "lucide-react";
import { PortalEncaixeLogo } from "@/components/app/logo";

export type PublicCompany = {
  name: string;
  city: string;
  sector: string;
};

export type PublicStats = {
  professionals: number;
  companies: number;
  screenings: number;
  referrals: number;
};

const heroImage = "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1800&q=86";

const steps: Array<{ title: string; text: string; icon: LucideIcon }> = [
  { title: "Cadastro", text: "Você informa seus dados, currículo e preferência de atuação.", icon: UserRoundCheck },
  { title: "Compatibilidade", text: "A plataforma cruza perfil, habilidades, localidade e requisitos.", icon: SearchCheck },
  { title: "Triagem", text: "A equipe avalia informações, documentos e aderência ao processo.", icon: ClipboardCheck },
  { title: "Encaminhamento", text: "Profissionais compatíveis seguem para oportunidades administradas.", icon: BriefcaseBusiness }
];

const professionalBenefits: Array<{ title: string; text: string; icon: LucideIcon }> = [
  { title: "Perfil Profissional", text: "Dados, habilidades e experiências reunidos em uma jornada clara.", icon: UserRoundCheck },
  { title: "Currículo Digital", text: "Envie seu arquivo ou gere um currículo profissional em PDF.", icon: FileText },
  { title: "Acompanhamento de Processos", text: "Veja cada etapa de triagem e encaminhamento no portal.", icon: History },
  { title: "Notificações em Tempo Real", text: "Receba avisos sobre atualizações importantes da sua jornada.", icon: Bell }
];

const companyBenefits: Array<{ title: string; text: string; icon: LucideIcon }> = [
  { title: "Demandas Privadas", text: "Cadastre necessidades internas sem transformar tudo em vaga pública.", icon: BriefcaseBusiness },
  { title: "Compatibilidade Inteligente", text: "Visualize profissionais alinhados aos critérios informados.", icon: CheckCircle2 },
  { title: "Triagem Especializada", text: "Conte com análise administrada antes do encaminhamento.", icon: ShieldCheck },
  { title: "Histórico Completo", text: "Acompanhe registros, resultados e etapas anteriores.", icon: History }
];

const testimonials = [
  {
    quote: "Consegui uma oportunidade incrível depois de ser encaminhado pela triagem administrada.",
    name: "Pedro Silva",
    role: "Técnico em TI"
  },
  {
    quote: "O acompanhamento transparente deixou o processo muito mais claro e sem ansiedade.",
    name: "Mariana Costa",
    role: "Assistente Administrativo"
  },
  {
    quote: "Recebemos candidatos triados com perfil extremamente aderente às nossas demandas.",
    name: "Atlas Indústria",
    role: "Empresa parceira"
  }
];

const differentials: Array<{ title: string; text: string; icon: LucideIcon }> = [
  { title: "Compatibilidade Profissional", text: "Critérios objetivos ajudam a aproximar perfil e demanda de forma justa.", icon: SearchCheck },
  { title: "Triagem Especializada", text: "Avaliação humana qualificada antes de qualquer encaminhamento.", icon: ClipboardCheck },
  { title: "Histórico de Processos", text: "Rastreabilidade completa para profissionais, empresas e administradores.", icon: History },
  { title: "Proteção de Dados", text: "Consentimentos, políticas de acesso e conformidade estrita com a LGPD.", icon: LockKeyhole }
];

const faq = [
  ["Como funciona a plataforma?", "Profissionais cadastram seu perfil, empresas registram demandas privadas e a administração conduz a compatibilidade, triagem e o encaminhamento qualificado."],
  ["Preciso pagar pelo cadastro?", "O cadastro profissional é 100% gratuito. Condições comerciais para empresas podem ser obtidas sob demanda com a equipe comercial."],
  ["Como acompanho meu processo?", "Após efetuar o login, o profissional acompanha cada etapa de triagem, notificações recebidas e o histórico de encaminhamentos."],
  ["Como uma empresa pode participar?", "A empresa cria sua conta, passa por uma validação cadastral e é liberada para registrar demandas privadas na plataforma."],
  ["Como meus dados são protegidos?", "O tratamento de dados segue rigorosamente a LGPD, com controle de consentimento, separação de dados e segurança de acesso."]
];

const fallbackCompanies: PublicCompany[] = [
  { name: "Norte Sul Serviços", city: "Campinas, SP", sector: "Serviços" },
  { name: "Atlas Indústria", city: "São Paulo, SP", sector: "Indústria" },
  { name: "Vetor Logística", city: "Guarulhos, SP", sector: "Logística" },
  { name: "Prime Care", city: "Rio de Janeiro, RJ", sector: "Saúde" },
  { name: "Delta Office", city: "Curitiba, PR", sector: "Administrativo" }
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function AnimatedCounter({ value, label }: { value: number; label: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Math.max(0, value);
    const duration = 1100;
    const start = performance.now();
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-100 hover:shadow-md">
      <strong className="block text-3xl font-extrabold tracking-tight text-blue-700">+{display.toLocaleString("pt-BR")}</strong>
      <span className="mt-2 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  );
}

function InfoCard({ title, text, icon: Icon }: { title: string; text: string; icon: LucideIcon }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-orange-200 hover:shadow-xl">
      <div className="flex size-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 shadow-inner">
        <Icon aria-hidden="true" size={22} />
      </div>
      <h3 className="mt-5 text-base font-bold text-blue-700 font-display">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500 font-medium">{text}</p>
    </article>
  );
}

export function PublicHome({ stats, companies }: { stats: PublicStats; companies: PublicCompany[] }) {
  const [scrolled, setScrolled] = useState(false);
  const companyList = companies.length > 0 ? companies : fallbackCompanies;
  const marqueeItems = useMemo(() => [...companyList, ...companyList], [companyList]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main id="conteudo" className="min-h-screen bg-[#FAFBFC] text-slate-900 font-sans">
      {/* Header institucional */}
      <header className={`fixed inset-x-0 top-0 z-50 h-20 border-b transition-all duration-200 ${scrolled ? "border-slate-200/80 bg-white/90 backdrop-blur-md shadow-sm" : "border-transparent bg-white/40 backdrop-blur-sm"}`}>
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <PortalEncaixeLogo />
          </Link>
          <nav aria-label="Navegação institucional" className="hidden items-center gap-7 text-sm font-semibold text-slate-500 lg:flex">
            <a className="transition hover:text-blue-700" href="#inicio">Início</a>
            <Link className="transition hover:text-blue-700" href="/sobre">Sobre</Link>
            <Link className="transition hover:text-blue-700" href="/como-funciona">Como Funciona</Link>
            <Link className="transition hover:text-blue-700" href="/vagas-publicas">Vagas Públicas</Link>
            <Link className="transition hover:text-blue-700" href="/empresas-parceiras">Empresas Parceiras</Link>
            <a className="transition hover:text-blue-700" href="#contato">Contato</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary py-2 px-4 rounded-xl text-xs sm:text-sm">
              Entrar
            </Link>
            <Link href="/register" className="btn-primary py-2 px-4 rounded-xl text-xs sm:text-sm shadow-md">
              Criar Conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="relative overflow-hidden bg-gradient-to-b from-white to-[#F1F4F8] pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-1/4 right-0 size-96 rounded-full bg-orange-200 blur-3xl" />
          <div className="absolute bottom-10 left-10 size-80 rounded-full bg-blue-200 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 lg:grid lg:grid-cols-12 lg:gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-xs font-bold text-orange-600 ring-1 ring-orange-100">
              <TrendingUp aria-hidden="true" size={14} />
              Oportunidades e carreiras em sintonia
            </p>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight tracking-tight text-blue-700 sm:text-6xl">
              Conectando você ao <span className="text-orange-500">profissional certo</span>.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-500 font-medium">
              Cadastre seu perfil de forma segura, participe de processos de triagem objetivos e seja encaminhado para demandas reais de empresas parceiras.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register" className="btn-primary py-3.5 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/20 text-sm">
                Criar Conta Grátis
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link href="/login" className="btn-secondary py-3.5 px-6 rounded-xl flex items-center gap-2 text-sm bg-white">
                Fazer Login
                <Mail aria-hidden="true" size={18} />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 mt-12 lg:mt-0 relative flex items-center justify-center">
            <div className="absolute size-full rounded-3xl bg-gradient-to-tr from-blue-900/10 to-orange-500/10 -rotate-2 scale-105 pointer-events-none" />
            <img 
              src={heroImage} 
              alt="Entrevista profissional" 
              className="relative w-full max-w-md lg:max-w-none rounded-3xl shadow-2xl border border-white/60 aspect-[4/3] object-cover" 
            />
          </div>
        </div>
      </section>

      {/* Marquee de empresas */}
      <section aria-label="Empresas parceiras" className="border-y border-slate-100 bg-[#F1F4F8]/50 py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Empresas parceiras da plataforma</h2>
            <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full">Triagem e cadastro LGPD ativos</span>
          </div>
          <div className="overflow-hidden">
            <div className="home-marquee flex w-max gap-4">
              {marqueeItems.map((company, index) => (
                <article key={`${company.name}-${index}`} className="flex w-72 shrink-0 items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:scale-[1.02] duration-200">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-sm font-bold text-orange-500 shadow-inner">
                    {initials(company.name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-blue-700">{company.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <MapPin aria-hidden="true" size={13} className="text-orange-500" />
                      {company.city}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-orange-500">{company.sector}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contadores */}
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 sm:grid-cols-2 md:grid-cols-4">
          <AnimatedCounter value={stats.professionals} label="Profissionais" />
          <AnimatedCounter value={stats.companies} label="Empresas Parceiras" />
          <AnimatedCounter value={stats.screenings} label="Triagens Realizadas" />
          <AnimatedCounter value={stats.referrals} label="Encaminhamentos" />
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="border-y border-slate-100 bg-[#F1F4F8] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-500">Como funciona</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-blue-700 font-display">Uma jornada clara entre cadastro, análise e contratação.</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <article key={step.title} className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md duration-300">
                {index < steps.length - 1 ? <div className="absolute left-[calc(100%-10px)] top-10 hidden h-0.5 w-8 bg-orange-200 lg:block" /> : null}
                <div className="flex items-center justify-between gap-3">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-blue-700 text-white shadow-md shadow-blue-900/15">
                    <step.icon aria-hidden="true" size={22} />
                  </span>
                  <span className="text-sm font-extrabold text-orange-500">0{index + 1}</span>
                </div>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Etapa {index + 1}</p>
                <h3 className="mt-1 text-lg font-bold text-blue-700 font-display">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 font-medium">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios profissionais */}
      <section id="profissionais" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-500">Para Profissionais</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-blue-700 font-display">Organize sua presença profissional em um único lugar.</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {professionalBenefits.map((benefit) => (
              <InfoCard key={benefit.title} {...benefit} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios empresas */}
      <section id="empresas" className="bg-[#F1F4F8] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-500">Para Empresas</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-blue-700 font-display">Demandas privadas com triagem qualificada e segura.</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {companyBenefits.map((benefit) => (
              <InfoCard key={benefit.title} {...benefit} />
            ))}
          </div>
        </div>
      </section>

      {/* Histórias de sucesso / depoimentos */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-500">Casos de Sucesso</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-blue-700 font-display">Pessoas e empresas que vivenciaram uma triagem mais objetiva.</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-200">
                <p className="text-base leading-7 text-slate-600 font-medium italic">"{testimonial.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-sm font-bold text-orange-500 shadow-inner">
                    {initials(testimonial.name)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-blue-700 font-display">{testimonial.name}</h3>
                    <p className="text-xs text-slate-400 font-semibold">{testimonial.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="border-t border-slate-100 bg-[#F1F4F8] py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.8fr_1.2fr] items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-500">Diferenciais</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-blue-700 font-display">O que torna a nossa triagem mais confiável.</h2>
            <p className="mt-4 leading-7 text-slate-500 font-medium">Combinamos cadastro padronizado de currículos, regras inteligentes de compatibilidade e triagem com avaliação humana para evitar o desgaste de currículos em vitrines públicas.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {differentials.map((item) => (
              <InfoCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* LGPD Banner */}
      <section className="bg-gradient-to-br from-[#0F2D4E] to-[#1B4E78] py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 size-80 rounded-full bg-orange-500 blur-2xl" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_0.9fr] items-center">
          <div>
            <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-white/10 text-orange-400">
              <LockKeyhole aria-hidden="true" size={24} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight font-display">Seus dados sempre protegidos</h2>
            <p className="mt-4 max-w-xl leading-8 text-blue-100 font-medium">
              Todo o tratamento de dados no Portal Encaixe segue rigorosamente a LGPD. O profissional mantém controle total sobre seus dados e consentimentos.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Consentimento explícito", "Privacidade de dados", "Histórico de auditoria", "Segurança por perfil"].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm font-semibold tracking-wide text-blue-100 flex items-center gap-3">
                <CheckCircle2 size={16} className="text-orange-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-500 text-center">FAQ</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-blue-700 text-center font-display">Perguntas Frequentes</h2>
          <div className="mt-10 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {faq.map(([question, answer]) => (
              <details key={question} className="group p-5 transition-all duration-300">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-blue-750 font-display">
                  {question}
                  <ChevronDown aria-hidden="true" className="shrink-0 text-slate-400 transition group-open:rotate-180" size={18} />
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-500 font-medium pl-1">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-[#F1F4F8] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl bg-gradient-to-br from-[#0F2D4E] to-[#1B4E78] p-8 md:p-12 shadow-xl text-white flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight font-display">Pronto para dar o próximo passo?</h2>
              <p className="mt-2 text-sm text-blue-200 max-w-md font-medium">Faça seu cadastro agora mesmo, estruture seu currículo e conecte-se com as melhores empresas.</p>
            </div>
            <Link href="/register" className="btn-primary py-4 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/25 self-start md:self-auto text-sm">
              Criar Cadastro
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="border-t border-slate-800 bg-[#091a2f] py-16 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 md:grid-cols-12 pb-10 border-b border-slate-800">
            <div className="md:col-span-6">
              <PortalEncaixeLogo />
              <p className="mt-4 text-sm leading-6 text-slate-400 max-w-sm">Conectando você ao profissional certo. Oportunidade, critério e acompanhamento em uma experiência de recrutamento inovadora.</p>
            </div>
            <nav aria-label="Links do rodapé" className="md:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#F2811D]">Plataforma</span>
                <Link href="/sobre" className="text-sm text-slate-400 hover:text-white transition">Sobre nós</Link>
                <Link href="/como-funciona" className="text-sm text-slate-400 hover:text-white transition">Como funciona</Link>
                <Link href="/vagas-publicas" className="text-sm text-slate-400 hover:text-white transition">Vagas</Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#F2811D]">Empresa</span>
                <Link href="/login" className="text-sm text-slate-400 hover:text-white transition">Entrar</Link>
                <Link href="/register" className="text-sm text-slate-400 hover:text-white transition">Cadastrar</Link>
                <a href="#contato" className="text-sm text-slate-400 hover:text-white transition">Contato</a>
              </div>
              <div className="flex flex-col gap-3 col-span-2 sm:col-span-1">
                <span className="text-xs font-bold uppercase tracking-widest text-[#F2811D]">Legal</span>
                <a href="#" className="text-sm text-slate-400 hover:text-white transition">Termos de Uso</a>
                <a href="#" className="text-sm text-slate-400 hover:text-white transition">Privacidade</a>
                <a href="#" className="text-sm text-slate-400 hover:text-white transition">LGPD</a>
              </div>
            </nav>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
            <span>&copy; {new Date().getFullYear()} Portal Encaixe. Todos os direitos reservados.</span>
            <span>Feito com cuidado para conectar talentos e empresas.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
