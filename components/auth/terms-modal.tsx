"use client";

import { useId, useState } from "react";

export function TermsModal({ label = "Ver Termos" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button className="text-sm font-semibold text-blue-700 underline-offset-4 hover:underline" type="button" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open ? (
        <div aria-labelledby={titleId} aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4" role="dialog">
          <div className="max-h-[82vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 id={titleId} className="text-lg font-semibold text-slate-950">Termos de Uso, Privacidade e LGPD</h2>
              <button aria-label="Fechar termos" className="rounded-md border border-slate-300 px-3 py-1 text-sm" type="button" onClick={() => setOpen(false)}>
                Fechar
              </button>
            </div>
            <div className="max-h-[62vh] overflow-y-auto px-5 py-4 text-sm leading-7 text-slate-700">
              <h3 className="font-semibold text-slate-950">Termos de Uso</h3>
              <p>O Portal de Triagem Profissional oferece ambiente privado para cadastro, triagem e encaminhamento administrado de profissionais e empresas. O usuário deve fornecer informações verdadeiras, manter seus dados atualizados e utilizar a plataforma somente para fins profissionais legítimos.</p>
              <p>A plataforma não garante contratação, publicação de vaga ou seleção automática. A triagem e o encaminhamento seguem critérios operacionais, requisitos informados pelas empresas e validação administrativa.</p>

              <h3 className="mt-5 font-semibold text-slate-950">Política de Privacidade</h3>
              <p>Coletamos dados cadastrais, profissionais, empresariais, documentos, currículos, registros de consentimento e histórico de processos para operar a triagem profissional. Os dados são utilizados para identificação, compatibilidade, suporte, comunicações transacionais e cumprimento de obrigações legais.</p>
              <p>Empresas visualizam apenas profissionais encaminhados pela administração. Dados sensíveis e documentos são protegidos por regras de acesso, armazenamento controlado e políticas de segurança.</p>

              <h3 className="mt-5 font-semibold text-slate-950">LGPD</h3>
              <p>O tratamento de dados observa princípios de finalidade, necessidade, transparência, segurança e prevenção. O usuário pode solicitar acesso, correção, portabilidade, anonimização ou exclusão de dados, observados registros que precisem ser mantidos por obrigação legal ou auditoria.</p>
              <p>Ao aceitar, registramos usuário, data, hora, IP, agente do navegador, versão dos termos e versão da política de privacidade.</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
