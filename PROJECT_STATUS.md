# Projeto
Portal de Triagem Profissional

# Objetivo
Plataforma de recrutamento e triagem profissional que conecta profissionais e empresas por meio de cadastro, banco de talentos, demandas, compatibilidade e encaminhamento qualificado.

# Concluido
- Ambientes separados para profissional, empresa e administrador.
- Login, cadastro, onboarding e protecao de acesso por perfil.
- Area profissional com perfil, minha area, processos, curriculo, notificacoes e configuracoes.
- Minha Area profissional com busca de vagas por cargo/local/modelo, recomendacoes priorizadas por perfil e indicador de forca do curriculo.
- Vitrine publica de vagas com busca, filtros, areas com oportunidades e cards detalhados de vaga/empresa.
- Area de curriculo com dados pessoais, objetivo, historico academico, experiencias, cursos, idiomas, habilidades e documento anexado.
- Area de curriculo com painel de qualidade, checklist de preenchimento e proximos ajustes recomendados.
- Navegacao superior por subgrupos na area de curriculo.
- Painel de personalizacao para baixar CV com 3 modelos, 7 cores e opcao de pretensao salarial.
- Menu principal recolhivel para liberar espaco na tela.
- Subgrupos do curriculo fixos durante a rolagem, com ajuste de ancoras para abrir cada bloco completo.
- Exportacao de curriculo em PDF respeitando modelo, cor e pretensao salarial selecionados.
- Configuracoes profissionais com grupos clicaveis e opcao de idioma local.
- Recuperacao de senha apontando para o dominio oficial da Vercel, com rota /auth/confirm para links por token hash.
- Reenvio de confirmacao de cadastro pela pagina /confirm-email, com mensagens de erro do Supabase traduzidas para o usuario.
- Cadastro por email/senha cria usuarios ja confirmados via Supabase Admin API, removendo bloqueio por email de confirmacao na entrada inicial.
- Login com Google sem perfil cadastrado encerra a sessao local e volta ao login com mensagem clara, sem prender o usuario no cadastro.
- Onboarding possui acao visivel de sair da conta e rota dedicada `/auth/sign-out`.
- Cadastro empresarial aceita email corporativo opcional, usando o email de acesso como fallback quando necessario.
- Suporte a email proprio de reset via Resend quando as variaveis seguras estiverem configuradas.
- Guia AUTH_SETUP.md com configuracao de Supabase SMTP, URLs de redirect e Google OAuth/branding.
- Fallback no proxy para redirecionar `/?code=...` para `/auth/callback` quando o Supabase retornar o codigo na raiz do dominio correto.

# Pendente
- Persistir as escolhas de modelo/cor do CV no banco, caso a personalizacao precise ser reutilizada em downloads futuros.
- Persistir idioma preferido no banco quando houver uma coluna dedicada para isso.
- Configurar SMTP personalizado e credenciais Google OAuth no painel Supabase/Google usando AUTH_SETUP.md.
- Trocar o Site URL do Supabase para `https://projetotriagem.vercel.app` e configurar dominio customizado de Auth se quiser remover `.supabase.co` da tela do Google.
- Configurar os templates de email do Supabase conforme AUTH_SETUP.md para usar token_hash em confirmacao e recuperacao nos fluxos legados.
- Revisar textos e acentuacao da interface em todo o projeto.

# Proximos Passos
- Melhorar a pre-visualizacao do CV antes do download.
- Validar fluxos completos com contas reais de profissional, empresa e admin.
- Validar recuperacao de senha apos o limite de 60 segundos do Supabase expirar.
- Evoluir os filtros de vagas para salvar pesquisas e alertas por email quando SMTP estiver pronto.

# Observacoes
- As chaves sensiveis do Supabase devem continuar fora do GitHub e ser configuradas em ambiente local/Vercel.
- A confirmacao por email nao e mais exigida para novos cadastros por email/senha; recuperacao de senha ainda depende de Supabase Auth ou Resend configurado.
- O deploy em producao ocorre pelo reposititorio GitHub conectado; esta tarefa nao altera configuracoes da Vercel.
