import { PublicPageShell } from "@/components/app/public-page-shell";

export default function PrivacyPage() {
  return (
    <PublicPageShell title="Política de Privacidade" description="Como os dados são coletados, usados e protegidos dentro da plataforma.">
      <div className="max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-700 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Dados coletados</h2>
        <p className="mt-3">Coletamos dados cadastrais, profissionais, empresariais, currículos, documentos, preferências, consentimentos e histórico de processos para operar a triagem profissional.</p>

        <h2 className="mt-6 text-lg font-semibold text-slate-950">Finalidade</h2>
        <p className="mt-3">Os dados são usados para autenticação, análise de compatibilidade, organização de currículos, encaminhamento para empresas, suporte, comunicações transacionais e cumprimento de obrigações legais.</p>

        <h2 className="mt-6 text-lg font-semibold text-slate-950">Compartilhamento</h2>
        <p className="mt-3">Empresas visualizam apenas profissionais apresentados pela administração. Dados sensíveis e documentos são protegidos por controle de acesso, políticas de segurança e registros de auditoria.</p>
      </div>
    </PublicPageShell>
  );
}
