# Portal de Triagem Profissional

Sistema Next.js com Supabase e Resend para triagem privada de profissionais, demandas internas de empresas e encaminhamento administrado.

## Stack

- Next.js App Router, React e TypeScript strict
- Supabase Auth, PostgreSQL, RLS, Storage e Realtime-ready
- Resend para emails transacionais
- Tailwind CSS v4 e Lucide React

## Setup

1. Instale as dependencias:

```bash
npm install
```

2. Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
NEXT_PUBLIC_APP_URL=https://projetotriagem.vercel.app
```

No deploy da Vercel, cadastre essas mesmas variaveis em Project Settings > Environment Variables. Nunca coloque valores reais em arquivos versionados no GitHub, principalmente `SUPABASE_SERVICE_ROLE_KEY`.

3. Aplique as migrations no Supabase:

```bash
supabase db push
```

4. Rode o seed:

```bash
supabase db reset
```

5. Inicie a aplicacao:

```bash
npm run dev
```

## Autenticacao

O projeto aceita email/senha e Google OAuth pelo Supabase. As configuracoes de dominio oficial, SMTP do email do site e Google OAuth estao em [`AUTH_SETUP.md`](./AUTH_SETUP.md).

Para Google, habilite o provider em Authentication > Providers e cadastre a URL de callback:

```text
https://projetotriagem.vercel.app/auth/callback
https://projetotriagem.vercel.app/auth/confirm
```

O usuario novo passa por:

1. Escolha de perfil: profissional ou empresa.
2. Cadastro profissional com CPF, telefone, nascimento, cidade, estado e LGPD.
3. Upload de curriculo PDF/DOCX ou preenchimento para geracao automatica.
4. Cadastro empresarial com CNPJ, contato corporativo e responsavel.

## Seguranca

- A chave `SUPABASE_SERVICE_ROLE_KEY` deve existir somente em ambiente de servidor.
- O frontend usa apenas `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Todas as tabelas principais tem RLS habilitado.
- Empresas so acessam profissionais encaminhados.
- Profissionais so acessam sua propria area, processos, curriculos, notificacoes e dados LGPD.
- Administradores tem acesso completo para triagem, empresas, profissionais, demandas e encaminhamentos.
- O servidor valida permissao por rota; esconder menu nao e a unica protecao.

## Funcionalidades implementadas

- Area publica com home, sobre, como funciona, vagas publicas, empresas parceiras, login e cadastro.
- Area do profissional com Minha Area, Perfil, Curriculo, Status de Triagem, Encaminhamentos, Notificacoes e Configuracoes.
- Area empresarial com Minha Empresa, Perfil da Empresa, Criar Demanda, Demandas Ativas, Candidatos Encaminhados, Historico, Notificacoes e Configuracoes.
- Area administrativa/recrutador com Dashboard, Novos candidatos, Empresas cadastradas, Demandas abertas, Encaminhamentos, Contratacoes, Banco de Talentos e Gestao de Candidatos.
- Menus superiores independentes por perfil, seguindo o planejamento da V1.
- Formularios funcionais de perfil profissional, perfil empresarial, criacao de demanda, notificacoes, LGPD e mudanca de status administrativa.
- Algoritmo TypeScript de score 0-100.
- Funcao SQL de recalculo automatico de score por demanda e perfil.
- Schema com empresas, profissionais, demandas, triagem, curriculos, notificacoes, LGPD, fila de reserva e auditoria.
- Buckets e politicas de Storage para curriculos, certificados, avatares e documentos.
- Templates transacionais Resend.

## Proximos blocos de produto

- Detalhes finos de entrevistas, contratacoes e fila de reserva.
- Gerador PDF com `@react-pdf/renderer`.
- Relatorios administrativos avancados.
- Auditoria visual das regras LGPD.
