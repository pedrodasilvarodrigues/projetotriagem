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
              <p>O Portal de Triagem Profissional oferece ambiente privado para cadastro, triagem e encaminhamento administrado de profissionais e empresas. O usuario deve fornecer informacoes verdadeiras, manter seus dados atualizados e utilizar a plataforma somente para fins profissionais legitimos.</p>
              <p>A plataforma nao garante contratacao, publicacao de vaga ou selecao automatica. A triagem e o encaminhamento seguem criterios operacionais, requisitos informados pelas empresas e validacao administrativa.</p>

              <h3 className="mt-5 font-semibold text-slate-950">Politica de Privacidade</h3>
              <p>Coletamos dados cadastrais, profissionais, empresariais, documentos, curriculos, registros de consentimento e historico de processos para operar a triagem profissional. Os dados sao utilizados para identificacao, compatibilidade, suporte, comunicacoes transacionais e cumprimento de obrigacoes legais.</p>
              <p>Empresas visualizam apenas profissionais encaminhados pela administracao. Dados sensiveis e documentos sao protegidos por regras de acesso, armazenamento controlado e politicas de seguranca.</p>

              <h3 className="mt-5 font-semibold text-slate-950">LGPD</h3>
              <p>O tratamento de dados observa principios de finalidade, necessidade, transparencia, seguranca e prevencao. O usuario pode solicitar acesso, correcao, portabilidade, anonimização ou exclusao de dados, observados registros que precisem ser mantidos por obrigacao legal ou auditoria.</p>
              <p>Ao aceitar, registramos usuario, data, hora, IP, agente do navegador, versao dos termos e versao da politica de privacidade.</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
