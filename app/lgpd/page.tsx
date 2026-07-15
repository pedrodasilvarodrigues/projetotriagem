import { PublicPageShell } from "@/components/app/public-page-shell";

export default function LgpdPage() {
  return (
    <PublicPageShell title="LGPD" description="Direitos do titular e compromissos de proteção de dados.">
      <div className="max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-700 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Princípios de tratamento</h2>
        <p className="mt-3">O tratamento de dados observa finalidade, necessidade, transparência, segurança, prevenção e responsabilização, conforme a Lei Geral de Proteção de Dados.</p>

        <h2 className="mt-6 text-lg font-semibold text-slate-950">Direitos do usuário</h2>
        <p className="mt-3">O usuário pode solicitar acesso, correção, portabilidade, anonimização ou exclusão de dados, respeitados registros que precisem ser mantidos por obrigação legal, segurança ou auditoria.</p>

        <h2 className="mt-6 text-lg font-semibold text-slate-950">Consentimento e registros</h2>
        <p className="mt-3">Ao aceitar os termos, a plataforma registra data, hora, IP, agente do navegador e versões dos documentos aceitos, mantendo evidências de consentimento.</p>
      </div>
    </PublicPageShell>
  );
}
