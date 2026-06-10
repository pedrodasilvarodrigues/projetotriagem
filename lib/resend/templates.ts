const base = (title: string, body: string) => `
<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#fafafa;font-family:Inter,Arial,sans-serif;color:#09090b">
    <main style="max-width:640px;margin:0 auto;padding:32px 20px">
      <h1 style="font-size:24px;line-height:1.2">${title}</h1>
      <section style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:24px">${body}</section>
      <p style="font-size:12px;color:#71717a;margin-top:24px">Portal de Triagem Profissional. Email transacional automatico.</p>
    </main>
  </body>
</html>`;

export const emailTemplates = {
  welcome_professional: (v: Record<string, string>) => ({ subject: "Bem-vindo ao Portal de Triagem", html: base("Bem-vindo, profissional", `<p>Ola ${v.name}. Seu perfil foi criado e sera analisado pela equipe.</p>`) }),
  welcome_company: (v: Record<string, string>) => ({ subject: "Empresa cadastrada no Portal", html: base("Cadastro empresarial recebido", `<p>Ola ${v.name}. Sua empresa ja pode registrar demandas internas apos aprovacao.</p>`) }),
  email_verification: (v: Record<string, string>) => ({ subject: "Verifique seu email", html: base("Verificacao de email", `<p>Use o link seguro para confirmar seu acesso: <a href="${v.url}">confirmar email</a>.</p>`) }),
  password_reset: (v: Record<string, string>) => ({ subject: "Redefinicao de senha", html: base("Redefina sua senha", `<p>Acesse o link seguro para criar uma nova senha: <a href="${v.url}">redefinir senha</a>.</p>`) }),
  profile_approved: (v: Record<string, string>) => ({ subject: "Perfil aprovado", html: base("Perfil aprovado", `<p>Ola ${v.name}. Seu cadastro foi aprovado pela equipe de triagem.</p>`) }),
  profile_rejected: (v: Record<string, string>) => ({ subject: "Perfil reprovado", html: base("Perfil reprovado", `<p>Ola ${v.name}. Motivo informado: ${v.reason}.</p>`) }),
  process_status_update: (v: Record<string, string>) => ({ subject: "Atualizacao no processo", html: base("Status atualizado", `<p>Seu processo agora esta em: <strong>${v.status}</strong>.</p>`) }),
  candidate_forwarded: (v: Record<string, string>) => ({ subject: "Candidato encaminhado", html: base("Novo candidato encaminhado", `<p>${v.candidate} foi encaminhado para a demanda ${v.demand}.</p>`) }),
  support_ticket_opened: (v: Record<string, string>) => ({ subject: "Chamado aberto", html: base("Recebemos seu chamado", `<p>Protocolo: <strong>${v.protocol}</strong>.</p>`) }),
  support_ticket_response: (v: Record<string, string>) => ({ subject: "Resposta no chamado", html: base("Nova resposta do suporte", `<p>${v.message}</p>`) }),
  training_available: (v: Record<string, string>) => ({ subject: "Treinamento disponivel", html: base("Treinamento liberado", `<p>A trilha ${v.track} esta disponivel para acompanhamento.</p>`) }),
  lgpd_data_export: (v: Record<string, string>) => ({ subject: "Exportacao de dados", html: base("Seus dados estao prontos", `<p>Acesse sua exportacao pelo link seguro: <a href="${v.url}">baixar dados</a>.</p>`) }),
  account_deletion_confirm: (v: Record<string, string>) => ({ subject: "Exclusao de conta confirmada", html: base("Conta removida", `<p>O processo de exclusao/anonimizacao foi concluido em ${v.date}.</p>`) })
};

export type EmailTemplateKey = keyof typeof emailTemplates;
