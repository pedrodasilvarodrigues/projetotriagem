const base = (title: string, body: string) => `
<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#fafafa;font-family:Inter,Arial,sans-serif;color:#09090b">
    <main style="max-width:640px;margin:0 auto;padding:32px 20px">
      <h1 style="font-size:24px;line-height:1.2">${title}</h1>
      <section style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:24px">${body}</section>
      <p style="font-size:12px;color:#71717a;margin-top:24px">Portal Encaixe. E-mail transacional automático.</p>
    </main>
  </body>
</html>`;

const safe = (value = "") => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] ?? char);

const portalLogoUrl = "https://www.portalencaixe.com.br/images/portal-encaixe-mark.png";

const brandedEmail = (input: { preheader: string; title: string; body: string }) => `
<!doctype html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
    <title>${safe(input.title)}</title>
    <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
    <![endif]-->
    <style>
      table, td { border-collapse: collapse; }
      img { border: 0; display: block; height: auto; line-height: 100%; outline: none; text-decoration: none; }
      a { color: inherit; }
      @media only screen and (max-width: 620px) {
        .email-outer { padding: 16px 10px !important; }
        .email-shell { width: 100% !important; }
        .email-header { padding: 24px 22px !important; }
        .email-content { padding: 32px 22px 28px !important; }
        .email-title { font-size: 28px !important; line-height: 34px !important; }
        .email-button { display: block !important; width: auto !important; }
        .email-footer { padding: 24px 16px 8px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;width:100%;background-color:#F1F4F8;color:#374151;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${safe(input.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F1F4F8">
      <tr>
        <td class="email-outer" align="center" style="padding:40px 16px;">
          <table role="presentation" class="email-shell" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#FAFBFC" style="width:600px;max-width:600px;border:1px solid #DCE7F0;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(15,45,78,0.10);">
            <tr><td height="5" bgcolor="#F2811D" style="height:5px;font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr>
              <td class="email-header" bgcolor="#0F2D4E" style="padding:28px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="68" valign="middle" style="width:68px;">
                      <img src="${portalLogoUrl}" width="56" height="56" alt="Portal Encaixe" style="width:56px;height:56px;border-radius:14px;">
                    </td>
                    <td valign="middle" style="padding-left:2px;">
                      <p style="margin:0;color:#FAFBFC;font-size:21px;line-height:26px;font-weight:700;letter-spacing:-0.3px;">Portal Encaixe</p>
                      <p style="margin:4px 0 0;color:#F5A24D;font-size:10px;line-height:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Profissional certo</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-content" style="padding:42px 44px 38px;">
                ${input.body}
              </td>
            </tr>
          </table>
          <table role="presentation" width="600" class="email-shell" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
            <tr>
              <td class="email-footer" align="center" style="padding:24px 20px 8px;color:#6B7280;font-size:12px;line-height:19px;">
                <strong style="color:#0F2D4E;">Portal Encaixe</strong><br>
                <a href="https://www.portalencaixe.com.br" style="color:#4B5563;text-decoration:none;">portalencaixe.com.br</a><br>
                <span>Esta é uma mensagem automática de segurança.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const passwordResetTemplate = (v: Record<string, string>) => {
  const resetUrl = safe(v.url);

  return {
    subject: "Redefina sua senha | Portal Encaixe",
    html: brandedEmail({
      preheader: "Use o link seguro para criar uma nova senha no Portal Encaixe.",
      title: "Redefina sua senha",
      body: `
        <p style="margin:0 0 12px;color:#F2811D;font-size:11px;line-height:16px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">Segurança da conta</p>
        <h1 class="email-title" style="margin:0;color:#0F2D4E;font-size:32px;line-height:39px;font-weight:700;letter-spacing:-0.7px;">Redefina sua senha</h1>
        <p style="margin:20px 0 0;color:#4B5563;font-size:16px;line-height:26px;">Recebemos uma solicitação para redefinir a senha da sua conta no Portal Encaixe.</p>
        <p style="margin:10px 0 0;color:#4B5563;font-size:16px;line-height:26px;">Clique no botão abaixo para acessar o ambiente seguro e criar uma nova senha.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0 28px;">
          <tr>
            <td align="center">
              <!--[if mso]>
                <v:roundrect href="${resetUrl}" style="height:52px;v-text-anchor:middle;width:260px;" arcsize="14%" strokecolor="#F2811D" fillcolor="#F2811D">
                  <w:anchorlock xmlns:w="urn:schemas-microsoft-com:office:word"/>
                  <center style="color:#FAFBFC;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;">Redefinir minha senha</center>
                </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
                <a class="email-button" href="${resetUrl}" target="_blank" style="display:inline-block;min-width:228px;padding:16px 24px;background-color:#F2811D;border:1px solid #F2811D;border-radius:8px;color:#FAFBFC;font-size:16px;line-height:20px;font-weight:700;text-align:center;text-decoration:none;box-shadow:0 8px 18px rgba(242,129,29,0.22);">Redefinir minha senha</a>
              <!--<![endif]-->
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FEF8F3" style="border:1px solid #FBE0C4;border-radius:10px;">
          <tr>
            <td style="padding:16px 18px;color:#74340D;font-size:14px;line-height:22px;">
              <strong>Não solicitou esta alteração?</strong><br>
              Você pode ignorar este e-mail. Sua senha atual continuará a mesma.
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 6px;color:#6B7280;font-size:12px;line-height:19px;">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
        <p style="margin:0;word-break:break-all;color:#1B4E78;font-size:12px;line-height:19px;"><a href="${resetUrl}" style="color:#1B4E78;text-decoration:underline;">${resetUrl}</a></p>
      `
    }),
    text: `Portal Encaixe\n\nRedefina sua senha\n\nRecebemos uma solicitação para redefinir a senha da sua conta no Portal Encaixe.\n\nAcesse o link seguro abaixo para criar uma nova senha:\n${v.url}\n\nSe você não solicitou esta alteração, ignore este e-mail. Sua senha atual continuará a mesma.\n\nPortal Encaixe\nportalencaixe.com.br`
  };
};

export const emailTemplates = {
  welcome_professional: (v: Record<string, string>) => ({ subject: "Bem-vindo ao Portal de Triagem", html: base("Bem-vindo, profissional", `<p>Olá, ${v.name}. Seu perfil foi criado e será analisado pela equipe.</p>`) }),
  welcome_company: (v: Record<string, string>) => ({ subject: "Empresa cadastrada no Portal", html: base("Cadastro empresarial recebido", `<p>Olá ${v.name}. Sua empresa já pode registrar demandas internas após aprovação.</p>`) }),
  email_verification: (v: Record<string, string>) => ({ subject: "Verifique seu e-mail", html: base("Verificação de e-mail", `<p>Use o link seguro para confirmar seu acesso: <a href="${v.url}">confirmar e-mail</a>.</p>`) }),
  password_reset: passwordResetTemplate,
  profile_approved: (v: Record<string, string>) => ({ subject: "Perfil aprovado", html: base("Perfil aprovado", `<p>Olá, ${v.name}. Seu cadastro foi aprovado pela equipe de triagem.</p>`) }),
  profile_rejected: (v: Record<string, string>) => ({ subject: "Perfil reprovado", html: base("Perfil reprovado", `<p>Olá, ${v.name}. Motivo informado: ${v.reason}.</p>`) }),
  process_status_update: (v: Record<string, string>) => ({ subject: "Atualização no processo", html: base("Situação atualizada", `<p>Seu processo agora está em: <strong>${v.status}</strong>.</p>`) }),
  candidate_forwarded: (v: Record<string, string>) => ({ subject: "Candidato encaminhado", html: base("Novo candidato encaminhado", `<p>${v.candidate} foi encaminhado para a demanda ${v.demand}.</p>`) }),
  support_ticket_opened: (v: Record<string, string>) => ({ subject: "Chamado aberto", html: base("Recebemos seu chamado", `<p>Protocolo: <strong>${v.protocol}</strong>.</p>`) }),
  support_ticket_response: (v: Record<string, string>) => ({ subject: "Resposta no chamado", html: base("Nova resposta do suporte", `<p>${v.message}</p>`) }),
  training_available: (v: Record<string, string>) => ({ subject: "Treinamento disponível", html: base("Treinamento liberado", `<p>A trilha ${v.track} está disponível para acompanhamento.</p>`) }),
  lgpd_data_export: (v: Record<string, string>) => ({ subject: "Exportação de dados", html: base("Seus dados estao prontos", `<p>Acesse sua exportação pelo link seguro: <a href="${v.url}">baixar dados</a>.</p>`) }),
  account_deletion_confirm: (v: Record<string, string>) => ({ subject: "Exclusão de conta confirmada", html: base("Conta removida", `<p>O processo de exclusão/anonimização foi concluído em ${v.date}.</p>`) }),
  marketplace_message: (v: Record<string, string>) => ({ subject: "Nova mensagem sobre um serviço", html: base("Você recebeu uma nova mensagem", `<p>Olá ${safe(v.name)}.</p><p>${safe(v.preview)}</p><p><a href="${safe(v.url)}">Abrir conversa no Portal Encaixe</a></p>`) }),
  company_plan_activated: (v: Record<string, string>) => ({
    subject: `Plano ${safe(v.plan)} ativado no Portal Encaixe`,
    html: base(
      "Seu acesso empresarial está liberado",
      `<p>Olá, ${safe(v.name)}.</p><p>O plano <strong>${safe(v.plan)}</strong> foi ativado. Sua equipe já pode acessar o painel empresarial.</p><p><a href="${safe(v.url)}">Acessar o painel</a></p>`
    )
  })
};

export type EmailTemplateKey = keyof typeof emailTemplates;
