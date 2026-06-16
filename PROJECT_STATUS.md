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
- Callback de autenticacao e confirmacao automatica de emails antigos estao protegidos contra erro 500, redirecionando para mensagens controladas no login.
- Pagina `/confirm-email` tenta liberar o acesso diretamente via Supabase Admin API antes de usar reenvio de email do Supabase.
- Recuperacao de senha trata limite de 1 minuto do Supabase como solicitacao recente, sem exibir erro vermelho de falha.
- Auditoria do login corrigiu escrita de cookies em Server Components, validacao de env do Supabase, logs de auth e falhas do proxy.
- Proxy usa `maybeSingle()` para roles, trata usuario sem role/perfil via onboarding e evita erro 500 em rotas protegidas.
- Aliases `/profissional` e `/empresa` redirecionam para `/professional` e `/company`.
- Login com Google pela tela de entrar nao prende mais o usuario no onboarding; contas sem cadastro completo voltam ao login com mensagem controlada.
- Perfil da empresa passou a aceitar campos complementares sem obrigatoriedade e preserva os dados ja existentes quando o usuario salva campos em branco.
- Preferencia de idioma agora atualiza a interface autenticada com persistencia no banco, traducao no menu e tradutor em tempo de execucao para textos principais.
- Area profissional ganhou a aba `/professional/search-demands` para listar todas as demandas abertas com empresa, local e modalidade.
- Minha Area profissional agora exibe tambem empresas com vagas abertas, deixando as empresas visiveis para os profissionais.
- Busca profissional na Minha Area agora tambem considera e exibe o nome da demanda publicada pela empresa.
- Barra fixa de subgrupos do curriculo ficou compacta, recolhivel por seta e sem textos auxiliares ocupando espaco.
- Acoes principais da Minha Area profissional receberam botoes mais consistentes e menos quebrados em telas estreitas.
- Perfis profissional e empresarial agora carregam automaticamente dados ja informados no cadastro, incluindo contato, documentos e endereco.
- Edicao dos perfis preserva dados existentes no Supabase e cria fallback de empresa quando a conta antiga ainda nao possui linha completa em `companies`.
- Contas antigas/Google com `user_roles` mas sem linha publica agora passam por sincronizacao automatica para criar `profiles`, `professionals` ou `companies` ao abrir o perfil.
- Banco permite perfil profissional parcial com `birth_date` nulo, evitando dados falsos para contas criadas pelo Google sem cadastro completo.
- Script `npm run lint` atualizado para validacao TypeScript compativel com Next.js 16.
- Suporte a email proprio de reset via Resend quando as variaveis seguras estiverem configuradas.
- Guia AUTH_SETUP.md com configuracao de Supabase SMTP, URLs de redirect e Google OAuth/branding.
- Fallback no proxy para redirecionar `/?code=...` para `/auth/callback` quando o Supabase retornar o codigo na raiz do dominio correto.

# Pendente
- Persistir as escolhas de modelo/cor do CV no banco, caso a personalizacao precise ser reutilizada em downloads futuros.
- Configurar SMTP personalizado e credenciais Google OAuth no painel Supabase/Google usando AUTH_SETUP.md.
- Trocar o Site URL do Supabase para `https://projetotriagem.vercel.app` e configurar dominio customizado de Auth se quiser remover `.supabase.co` da tela do Google.
- Configurar os templates de email do Supabase conforme AUTH_SETUP.md para usar token_hash em confirmacao e recuperacao nos fluxos legados.
- Expandir a traducao textual para todas as paginas restantes, incluindo areas publicas e mensagens menos frequentes.
- Revisar textos e acentuacao da interface em todo o projeto.

# Proximos Passos
- Melhorar a pre-visualizacao do CV antes do download.
- Validar fluxos completos com contas reais de profissional, empresa e admin.
- Validar Google OAuth em producao depois da configuracao final de branding e redirect URLs no painel do Supabase.
- Validar recebimento real de recuperacao de senha com SMTP/Resend configurado em producao.
- Atualizar a `SUPABASE_SERVICE_ROLE_KEY` em producao/local se o Supabase continuar retornando `Invalid API key` para fluxos administrativos.
- Evoluir os filtros de vagas para salvar pesquisas e alertas por email quando SMTP estiver pronto.

# Observacoes
- As chaves sensiveis do Supabase devem continuar fora do GitHub e ser configuradas em ambiente local/Vercel.
- A confirmacao por email nao e mais exigida para novos cadastros por email/senha; recuperacao de senha ainda depende de Supabase Auth ou Resend configurado.
- O limite de reenvio de recuperacao do Supabase continua existindo na API externa; a interface agora comunica como pedido recente e nao como quebra.
- A auditoria local encontrou `SUPABASE_SERVICE_ROLE_KEY` invalida para Admin API; o login por email/senha com anon key foi validado contra o Supabase e retorna erros controlados.
- O deploy em producao ocorre pelo reposititorio GitHub conectado; esta tarefa nao altera configuracoes da Vercel.
