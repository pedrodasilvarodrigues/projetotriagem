# Projeto
Portal de Triagem Profissional

# Objetivo
Plataforma de recrutamento e triagem profissional que conecta profissionais e empresas por meio de cadastro, banco de talentos, demandas, compatibilidade e encaminhamento qualificado.

# Concluido
- Ambientes separados para profissional, empresa e administrador.
- Login, cadastro, onboarding e protecao de acesso por perfil.
- Area profissional com perfil, minha area, processos, curriculo, notificacoes e configuracoes.
- Area de curriculo com dados pessoais, objetivo, historico academico, experiencias, cursos, idiomas, habilidades e documento anexado.
- Navegacao superior por subgrupos na area de curriculo.
- Painel de personalizacao para baixar CV com 3 modelos, 7 cores e opcao de pretensao salarial.
- Menu principal recolhivel para liberar espaco na tela.
- Subgrupos do curriculo fixos durante a rolagem, com ajuste de ancoras para abrir cada bloco completo.
- Exportacao de curriculo em PDF respeitando modelo, cor e pretensao salarial selecionados.
- Configuracoes profissionais com grupos clicaveis e opcao de idioma local.
- Recuperacao de senha apontando para o dominio oficial da Vercel, com rota /auth/confirm para links por token hash.
- Suporte a email proprio de reset via Resend quando as variaveis seguras estiverem configuradas.
- Guia AUTH_SETUP.md com configuracao de Supabase SMTP, URLs de redirect e Google OAuth/branding.
- Fallback no proxy para redirecionar `/?code=...` para `/auth/callback` quando o Supabase retornar o codigo na raiz do dominio correto.

# Pendente
- Persistir as escolhas de modelo/cor do CV no banco, caso a personalizacao precise ser reutilizada em downloads futuros.
- Persistir idioma preferido no banco quando houver uma coluna dedicada para isso.
- Configurar SMTP personalizado e credenciais Google OAuth no painel Supabase/Google usando AUTH_SETUP.md.
- Trocar o Site URL do Supabase para `https://projetotriagem.vercel.app` e configurar dominio customizado de Auth se quiser remover `.supabase.co` da tela do Google.
- Revisar textos e acentuacao da interface em todo o projeto.

# Proximos Passos
- Melhorar a pre-visualizacao do CV antes do download.
- Validar fluxos completos com contas reais de profissional, empresa e admin.

# Observacoes
- As chaves sensiveis do Supabase devem continuar fora do GitHub e ser configuradas em ambiente local/Vercel.
- O deploy em producao ocorre pelo reposititorio GitHub conectado; esta tarefa nao altera configuracoes da Vercel.
