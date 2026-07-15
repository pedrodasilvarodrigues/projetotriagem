import { PublicPageShell } from "@/components/app/public-page-shell";

export default function TermsOfUsePage() {
  return (
    <PublicPageShell title="Termos de Uso" description="Regras gerais para uso do Portal de Triagem Profissional.">
      <div className="max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-700 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Uso da plataforma</h2>
        <p className="mt-3">O Portal de Triagem Profissional oferece um ambiente para cadastro, organização de currículos, registro de demandas empresariais, análise de compatibilidade e encaminhamento de profissionais.</p>
        <p className="mt-3">O usuário deve fornecer informações verdadeiras, manter seus dados atualizados e utilizar a plataforma apenas para fins profissionais legítimos.</p>

        <h2 className="mt-6 text-lg font-semibold text-slate-950">Triagem e encaminhamento</h2>
        <p className="mt-3">A plataforma não garante contratação, publicação de vaga, aprovação automática ou seleção definitiva. A triagem depende dos dados cadastrados, dos requisitos das empresas e da validação administrativa.</p>

        <h2 className="mt-6 text-lg font-semibold text-slate-950">Responsabilidades</h2>
        <p className="mt-3">Profissionais são responsáveis pela veracidade de seus dados. Empresas são responsáveis pelas informações de suas demandas. A administração pode bloquear, arquivar ou revisar cadastros em caso de inconsistência, uso indevido ou violação das regras.</p>
      </div>
    </PublicPageShell>
  );
}
