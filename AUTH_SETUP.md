# Configuracao de autenticacao

Este projeto usa Supabase Auth, mas os fluxos publicos devem apontar para o dominio oficial:

```text
https://projetotriagem.vercel.app
```

## Variaveis na Vercel

Em Vercel > Project Settings > Environment Variables, mantenha:

```env
NEXT_PUBLIC_APP_URL=https://projetotriagem.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://znmlgfllkwtcyvrpmwbt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL="Portal de Triagem Profissional <notificacoes@seudominio.com>"
```

`SUPABASE_SERVICE_ROLE_KEY` e `RESEND_API_KEY` nunca devem ser enviados ao GitHub.

## Recuperacao de senha

O codigo agora sempre monta links de recuperacao com o dominio oficial, mesmo quando a acao e disparada por engano em `localhost`.

Quando `RESEND_API_KEY`, `RESEND_FROM_EMAIL` e `SUPABASE_SERVICE_ROLE_KEY` estiverem configurados, o app envia o email de reset pelo remetente do portal usando Resend. O link enviado aponta para:

```text
https://projetotriagem.vercel.app/auth/confirm?token_hash=...&type=recovery&next=/update-password
```

Se o Resend ainda nao estiver configurado, o app usa o email nativo do Supabase como fallback, mas o `redirectTo` tambem aponta para a Vercel:

```text
https://projetotriagem.vercel.app/auth/callback?next=/update-password
```

## Supabase URL Configuration

No Supabase Dashboard > Authentication > URL Configuration:

```text
Site URL:
https://projetotriagem.vercel.app

Redirect URLs:
https://projetotriagem.vercel.app/auth/callback
https://projetotriagem.vercel.app/auth/confirm
http://localhost:3000/auth/callback
```

O localhost pode ficar apenas para desenvolvimento. Em producao, o fluxo usa o dominio da Vercel.

## Email oficial do site

Para o email deixar de aparecer como `Supabase Auth <noreply@mail.app.supabase.io>`, configure SMTP personalizado em Supabase Dashboard > Authentication > SMTP Settings.

Use um servico como Resend, Postmark, SendGrid ou Brevo. Campos esperados:

```text
Sender name:
Portal de Triagem Profissional

Sender email:
notificacoes@seudominio.com

SMTP host, port, user e password:
valores fornecidos pelo provedor de email
```

No template de recuperacao do Supabase, use um link com `token_hash` para manter o usuario dentro do dominio oficial:

```html
<h2>Redefina sua senha</h2>
<p>Use o link abaixo para criar uma nova senha:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/update-password">
    Redefinir senha
  </a>
</p>
```

## Google OAuth

Para o Google mostrar o nome do portal em vez de `znmlgfllkwtcyvrpmwbt.supabase.co`, configure credenciais proprias no Google Auth Platform e depois cole o Client ID/Secret no Supabase.

No Google Auth Platform:

```text
App name:
Portal de Triagem Profissional

Authorized JavaScript origins:
https://projetotriagem.vercel.app

Authorized redirect URIs:
https://znmlgfllkwtcyvrpmwbt.supabase.co/auth/v1/callback
```

Depois, no Supabase Dashboard > Authentication > Providers > Google:

```text
Enable Google provider: on
Client ID: valor do Google
Client Secret: valor do Google
```

Opcional, mas recomendado: configurar um dominio customizado para o Supabase Auth, como `auth.seudominio.com`, para o Google tambem deixar de exibir o subdominio `.supabase.co`.
