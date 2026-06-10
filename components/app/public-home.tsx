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
  { title: "Cadastro", text: "Voce informa seus dados, curriculo e preferencia de atuacao.", icon: UserRoundCheck },
  { title: "Compatibilidade", text: "A plataforma cruza perfil, habilidades, localidade e requisitos.", icon: SearchCheck },
  { title: "Triagem", text: "A equipe avalia informacoes, documentos e aderencia ao processo.", icon: ClipboardCheck },
  { title: "Encaminhamento", text: "Profissionais compativeis seguem para oportunidades administradas.", icon: BriefcaseBusiness }
];

const professionalBenefits: Array<{ title: string; text: string; icon: LucideIcon }> = [
  { title: "Perfil Profissional", text: "Dados, habilidades e experiencias reunidos em uma jornada clara.", icon: UserRoundCheck },
  { title: "Curriculo Digital", text: "Envie seu arquivo ou gere um curriculo profissional em PDF.", icon: FileText },
  { title: "Acompanhamento de Processos", text: "Veja cada etapa de triagem e encaminhamento no portal.", icon: History },
  { title: "Notificacoes em Tempo Real", text: "Receba avisos sobre atualizacoes importantes da sua jornada.", icon: Bell }
];

const companyBenefits: Array<{ title: string; text: string; icon: LucideIcon }> = [
  { title: "Demandas Privadas", text: "Cadastre necessidades internas sem transformar tudo em vaga publica.", icon: BriefcaseBusiness },
  { title: "Compatibilidade Inteligente", text: "Visualize profissionais alinhados aos criterios informados.", icon: CheckCircle2 },
  { title: "Triagem Especializada", text: "Conte com analise administrada antes do encaminhamento.", icon: ShieldCheck },
  { title: "Historico Completo", text: "Acompanhe registros, resultados e etapas anteriores.", icon: History }
];

const testimonials = [
  {
    quote: "Consegui uma oportunidade depois de ser encaminhado pela plataforma.",
    name: "Pedro Silva",
    role: "Tecnico em TI"
  },
  {
    quote: "O acompanhamento deixou o processo mais claro e menos ansioso.",
    name: "Mariana Costa",
    role: "Assistente Administrativo"
  },
  {
    quote: "Recebemos candidatos com perfil mais proximo da nossa demanda.",
    name: "Atlas Industria",
    role: "Empresa parceira"
  }
];

const differentials: Array<{ title: string; text: string; icon: LucideIcon }> = [
  { title: "Compatibilidade Profissional", text: "Criterios objetivos ajudam a aproximar perfil e demanda.", icon: SearchCheck },
  { title: "Triagem Especializada", text: "Avaliacao humana antes de qualquer encaminhamento.", icon: ClipboardCheck },
  { title: "Historico de Processos", text: "Rastreabilidade para profissionais, empresas e administradores.", icon: History },
  { title: "Protecao de Dados", text: "Consentimentos, politicas e regras de acesso alinhados a LGPD.", icon: LockKeyhole }
];

const faq = [
  ["Como funciona a plataforma?", "Profissionais cadastram seu perfil, empresas registram demandas privadas e a administracao conduz compatibilidade, triagem e encaminhamento."],
  ["Preciso pagar?", "O cadastro profissional e gratuito. Condicoes comerciais para empresas podem ser definidas conforme operacao da plataforma."],
  ["Como acompanho meu processo?", "Depois do login, o profissional acompanha etapas, notificacoes e historico diretamente na area autenticada."],
  ["Como uma empresa participa?", "A empresa cria conta, informa seus dados cadastrais e passa a registrar demandas privadas depois da validacao."],
  ["Como meus dados sao protegidos?", "O tratamento segue principios de LGPD, com consentimento, controle de acesso e separacao entre dados publicos, internos e encaminhados."]
];

const fallbackCompanies: PublicCompany[] = [
  { name: "Norte Sul Servicos", city: "Campinas, SP", sector: "Servicos" },
  { name: "Atlas Industria", city: "Sao Paulo, SP", sector: "Industria" },
  { name: "Vetor Logistica", city: "Guarulhos, SP", sector: "Logistica" },
  { name: "Prime Care", city: "Rio de Janeiro, RJ", sector: "Saude" },
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
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <strong className="block text-3xl font-semibold tracking-normal text-slate-950">+{display.toLocaleString("pt-BR")}</strong>
      <span className="mt-1 block text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
}

function InfoCard({ title, text, icon: Icon }: { title: string; text: string; icon: LucideIcon }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md">
      <div className="flex size-11 items-center justify-center rounded-md bg-blue-50 text-blue-700">
        <Icon aria-hidden="true" size={21} />
      </div>
      <h3 className="mt-5 text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
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
    <main id="conteudo" className="min-h-screen bg-white text-slate-950">
      <header className={`fixed inset-x-0 top-0 z-50 h-20 border-b bg-white/95 backdrop-blur transition ${scrolled ? "border-slate-200 shadow-sm" : "border-transparent"}`}>
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="flex size-10 items-center justify-center rounded-md bg-blue-700 text-white">
              <BriefcaseBusiness aria-hidden="true" size={21} />
            </span>
            <span>Portal de Triagem</span>
          </Link>
          <nav aria-label="Navegacao institucional" className="hidden items-center gap-7 text-sm font-medium text-slate-600 lg:flex">
            <a className="transition hover:text-slate-950" href="#inicio">Inicio</a>
            <Link className="transition hover:text-slate-950" href="/sobre">Sobre</Link>
            <Link className="transition hover:text-slate-950" href="/como-funciona">Como Funciona</Link>
            <Link className="transition hover:text-slate-950" href="/vagas-publicas">Vagas Publicas</Link>
            <Link className="transition hover:text-slate-950" href="/empresas-parceiras">Empresas Parceiras</Link>
            <a className="transition hover:text-slate-950" href="#contato">Contato</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50">
              Entrar
            </Link>
            <Link href="/register" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800">
              Criar Conta
            </Link>
          </div>
        </div>
      </header>

      <section id="inicio" className="relative min-h-screen overflow-hidden pt-20">
        <img src={heroImage} alt="Entrevista profissional em ambiente corporativo" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-6 py-14">
          <div className="max-w-3xl text-white">
            <p className="inline-flex items-center gap-2 rounded-md bg-white/12 px-3 py-1 text-sm font-medium text-blue-50 ring-1 ring-white/20">
              <TrendingUp aria-hidden="true" size={16} />
              Existem oportunidades aqui
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal md:text-6xl">
              O proximo passo da sua carreira pode comecar hoje.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50">
              Cadastre seu perfil, participe de processos de triagem e seja encaminhado para oportunidades compativeis com suas habilidades e experiencias.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-blue-50">
                Criar Conta
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                Entrar
                <Mail aria-hidden="true" size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Empresas que utilizam nossa plataforma" className="border-b border-slate-200 bg-slate-50 py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-normal">Empresas que utilizam nossa plataforma</h2>
            <span className="text-sm text-slate-500">Dados conectados ao cadastro empresarial</span>
          </div>
          <div className="overflow-hidden">
            <div className="home-marquee flex w-max gap-4">
              {marqueeItems.map((company, index) => (
                <article key={`${company.name}-${index}`} className="flex w-72 shrink-0 items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex size-12 items-center justify-center rounded-md bg-blue-50 text-sm font-semibold text-blue-800">
                    {initials(company.name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-950">{company.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin aria-hidden="true" size={13} />
                      {company.city}
                    </p>
                    <p className="mt-1 text-xs font-medium text-blue-700">{company.sector}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 md:grid-cols-4">
          <AnimatedCounter value={stats.professionals} label="Profissionais" />
          <AnimatedCounter value={stats.companies} label="Empresas" />
          <AnimatedCounter value={stats.screenings} label="Triagens" />
          <AnimatedCounter value={stats.referrals} label="Encaminhamentos" />
        </div>
      </section>

      <section id="como-funciona" className="border-y border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-blue-700">Como funciona</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">Uma jornada clara entre cadastro, analise e oportunidade.</h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {steps.map((step, index) => (
              <article key={step.title} className="relative rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                {index < steps.length - 1 ? <div className="absolute left-[calc(100%-10px)] top-10 hidden h-px w-8 bg-slate-300 lg:block" /> : null}
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-md bg-blue-700 text-white">
                    <step.icon aria-hidden="true" size={21} />
                  </span>
                  <ChevronDown aria-hidden="true" className="text-slate-300 lg:hidden" size={18} />
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-normal text-slate-500">Etapa {index + 1}</p>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="profissionais" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-blue-700">Profissionais</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">Organize sua presenca profissional em um unico lugar.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {professionalBenefits.map((benefit) => (
              <InfoCard key={benefit.title} {...benefit} />
            ))}
          </div>
        </div>
      </section>

      <section id="empresas" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-blue-700">Empresas</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">Demandas privadas com triagem organizada e rastreavel.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {companyBenefits.map((benefit) => (
              <InfoCard key={benefit.title} {...benefit} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-blue-700">Historias de sucesso</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal">Pessoas e empresas com processos mais objetivos.</h2>
            </div>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-base leading-7 text-slate-700">"{testimonial.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-700">{initials(testimonial.name)}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">{testimonial.name}</h3>
                    <p className="text-xs text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-medium text-blue-700">Diferenciais</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">O que torna a triagem mais confiavel.</h2>
            <p className="mt-4 leading-7 text-slate-600">A plataforma combina cadastro estruturado, criterios de compatibilidade e acompanhamento administrado sem expor candidatos em vitrines publicas.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {differentials.map((item) => (
              <InfoCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-blue-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="mb-5 flex size-12 items-center justify-center rounded-md bg-white/10">
              <LockKeyhole aria-hidden="true" size={24} />
            </div>
            <h2 className="text-3xl font-semibold tracking-normal">Seus dados protegidos</h2>
            <p className="mt-5 max-w-2xl leading-8 text-blue-100">
              Tratamento de dados em conformidade com a LGPD, garantindo seguranca, transparencia e controle para usuarios e empresas.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Consentimento registrado", "Acesso por perfil", "Historico rastreavel", "Solicitacoes LGPD"].map((item) => (
              <div key={item} className="rounded-lg border border-white/15 bg-white/10 p-4 text-sm font-medium">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-sm font-medium text-blue-700">FAQ</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal">Perguntas frequentes</h2>
          <div className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {faq.map(([question, answer]) => (
              <details key={question} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold">
                  {question}
                  <ChevronDown aria-hidden="true" className="shrink-0 text-slate-400 transition group-open:rotate-180" size={18} />
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-600">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-14 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal">Pronto para dar o proximo passo?</h2>
            <p className="mt-2 text-sm text-slate-300">Crie seu cadastro e comece sua jornada profissional.</p>
          </div>
          <Link href="/register" className="inline-flex w-fit items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50">
            Criar Conta
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </section>

      <footer id="contato" className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 font-semibold">
              <span className="flex size-9 items-center justify-center rounded-md bg-blue-700 text-white">
                <Building2 aria-hidden="true" size={18} />
              </span>
              Portal de Triagem Profissional
            </div>
            <p className="mt-2 text-sm text-slate-500">Oportunidade, criterio e acompanhamento em uma experiencia profissional.</p>
          </div>
          <nav aria-label="Links do rodape" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            <a href="#">Sobre</a>
            <a href="#contato">Contato</a>
            <a href="/login">Suporte</a>
            <a href="#">Termos de Uso</a>
            <a href="#">Politica de Privacidade</a>
            <a href="#">LGPD</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
