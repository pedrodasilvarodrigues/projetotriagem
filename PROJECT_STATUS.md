# Projeto
Portal de Triagem Profissional

# Objetivo
Plataforma de recrutamento e triagem profissional que conecta profissionais e empresas por meio de cadastro, banco de talentos, demandas, compatibilidade e encaminhamento qualificado.

# Concluido
- Redesign visual completo e polimento da UX aplicados para a identidade do Portal Encaixe:
  - Definida nova paleta de cores (Azul-marinho `#0F2D4E`, Laranja `#F2811D`, etc.) e tipografia (*Poppins* e *Plus Jakarta Sans*) no globals.css.
  - Criado componente de logotipo animado logo.tsx (aperto de mãos + engrenagem).
  - Redesenhada a Landing Page pública (public-home.tsx) com nova seção Hero clara, botões e cards com elevação.
  - Atualizadas as telas de autenticação (login, register, forgot-password, update-password, confirm-email) com layouts modernos e cores da nova marca.
  - Ajustadas as barras de navegação (nav.tsx), cabeçalhos e cascas gerais do sistema (shell.tsx).
  - Adicionadas animações interativas e fluidas (splash screen com sessionStorage e pular com Esc, efeito Tilt 3D com acompanhamento do cursor do mouse no desktop, e efeito flutuante nos backgrounds).
  - Implementado sistema de Scroll Reveal (IntersectionObserver) para carregamento gradual das seções e cards da Landing Page ao rolar a página.
  - Inseridas transições de rota suaves de slide/fade-in (AppShell) ao navegar pelos menus dos dashboards.
  - Refatorados formulários de cadastro de Profissional e Empresa para usar os novos inputs arredondados da marca e feedback de botão ao submeter.
  - Elevada a qualidade de todos os cards da aplicação (públicos e internos) com cantos arredondados super suaves (`rounded-2xl`), sombras difusas em camadas, realce de borda no hover, borda superior laranja nos cards de métricas, tipografia display e badges de status arredondados.
- PDF de memoria tecnica para continuidade no Claude criado em `output/pdf/memoria-projeto-triagem-claude.pdf`, com arquitetura, rotas, fluxos criticos, integracoes, comandos e pendencias do Projeto Triagem.
- Ambientes separados para profissional, empresa e administrador.
- Login, cadastro, onboarding e protecao de acesso por perfil.
- Area profissional com perfil, minha area, processos, curriculo, notificacoes e configuracoes.
- Minha Area profissional com busca de vagas por cargo/local/modelo, recomendacoes priorizadas por perfil e indicador de forca do curriculo.
- Vitrine publica de vagas com busca, filtros, areas com oportunidades e cards detalhados de vaga/empresa.
- Area de curriculo com dados pessoais, objetivo, historico academico, experiencias, cursos, idiomas, habilidades e documento anexado.
- Perfil e curriculo profissionais agora compartilham campos com mascara de CPF, telefone e CEP, data digitavel em `dd/mm/aaaa` e preenchimento automatico de endereco pelo ViaCEP.
- Salvamento de perfil e dados pessoais do curriculo normaliza os valores, detecta CPF duplicado, verifica erros do Supabase e informa exatamente qual campo precisa de correcao.
- Acoes do curriculo nao redirecionam mais para o perfil quando a leitura do profissional falha; o contexto ressincroniza a linha, permanece na aba de origem e usa fallback seguro de persistencia para o proprio usuario.
- Criada migration `20260619012252_fix_professionals_rls_recursion.sql` para remover a recursao RLS entre `professionals` e `screening_processes`, causa raiz do loop perfil/curriculo em contas profissionais.
- Aplicada no Supabase de producao a correcao RLS de `professionals`; leitura do proprio registro profissional validada sem erro `42P17`.
- Blocos do curriculo fora de dados pessoais agora tratam erro real do Supabase e tentam fallback server-side ao salvar formacao, cursos, idiomas, habilidades e experiencias.
- Salvamento da aba Curriculo passou a usar funcoes RPC `SECURITY DEFINER` especificas para objetivo, formacao, cursos, idiomas, habilidades e experiencias, evitando falhas de RLS nas tabelas filhas.
- Corrigida em producao a funcao `invalidate_resume_cache`, que quebrava updates em `professionals` e inserts em partes do curriculo por tentar ler `new.professional_id` onde o campo nao existia.
- Usuario `flaviooliveirarodri44@gmail.com` promovido para `admin` em `user_roles`.
- Responsividade mobile da area admin ajustada: topo/menu em grade no celular, conteudo com padding menor, titulos compactos, cards do dashboard adaptaveis e tabelas convertidas em cards empilhados em telas pequenas.
- Area administrativa reorganizada para operacao sem dashboard complexo: menus Profissionais, Empresas, Demandas, Processos, Cursos, Relatorios e Configuracoes.
- Profissionais administrativos agora possuem listagem com busca/filtros, detalhe com perfil/curriculo/historico, controle de status, arquivamento e apresentacao para empresas.
- Criada tabela `professional_presentations` com RLS admin-only para registrar apresentacoes profissional-empresa com data, hora, admin responsavel, empresa, profissional, status e observacoes.
- Empresas administrativas agora exibem demandas vinculadas, profissionais apresentados, controle de status, arquivamento e pagina de detalhe.
- Demandas administrativas agora permitem criacao, filtro, encerramento, reabertura, arquivamento, visualizacao de requisitos, salario, experiencia e candidatos vinculados.
- Processos administrativos agora acompanham o fluxo operacional de triagem com alteracao de status, observacoes, entrevistas/resultados e encerramento.
- Modulos Cursos, Treinamentos, Instituicoes e Integracoes foram adicionados como paginas institucionais bloqueadas em desenvolvimento.
- Relatorios administrativos simples adicionados sem graficos complexos, com totais de profissionais, empresas, demandas, processos, apresentacoes e contratacoes.
- Configuracoes administrativas globais estruturadas para Termos, Privacidade, LGPD, emails automaticos, categorias, areas de atuacao e parametros do sistema.
- Alias `/administrador` criado apontando para `/admin`; acesso segue protegido por `requireRole("admin")`.
- Navegacao da area admin agora usa menu lateral fixo no desktop e gaveta lateral no mobile acionada por botao de tres tracos, sem afetar profissional ou empresa.
- Dashboard administrativo simples adicionado na entrada `/admin`, com contagens reais de profissionais, empresas, demandas, processos, apresentacoes e contratacoes.
- Menu administrativo voltou para lista simples de secoes principais, mantendo Dashboard, Profissionais, Empresas, Demandas, Processos e demais modulos.
- Aba administrativa de Demandas passou a concentrar apresentacao de candidatos por demanda, ordenando profissionais por compatibilidade e permitindo apresentar ou colocar na fila reserva.
- Criacao de demandas pelo administrador foi removida; demandas devem ser criadas pelas empresas e apenas gerenciadas/apresentadas pelo admin.
- Criado catalogo de instituicoes com tabela `institutions`, RLS, status `active/pending/archived`, autocomplete inteligente em campos de Instituicao e cadastro de novas instituicoes como pendentes.
- Area administrativa de Instituicoes implementada com listagem, pesquisa, edicao, aprovacao, arquivamento e exclusao.
- Campos de data restantes em curriculo/onboarding foram trocados de calendario para digitacao no formato `dd/mm/aaaa`.
- Menus das areas profissional e empresarial voltaram a usar navegacao horizontal rolante em todas as larguras de tela.
- Area empresarial agora mostra somente candidatos efetivamente apresentados pelo administrador, vinculados a cada demanda, com contato, perfil e situacao do processo; a fila reserva permanece oculta.
- Empresas podem encerrar uma demanda diretamente na listagem ou na edicao quando a vaga for preenchida, removendo-a das oportunidades abertas.
- Revisão ortográfica completa aplicada à interface, mensagens, e-mails e PDFs, com correção de acentuação, cedilha, concordância e tradução de termos técnicos visíveis para português.
- Area de curriculo com painel de qualidade, checklist de preenchimento e proximos ajustes recomendados.
- Navegacao superior por subgrupos na area de curriculo.
- Painel de personalizacao para baixar CV com 3 modelos, 7 cores e opcao de pretensao salarial.
- Menu principal recolhivel para liberar espaco na tela.
- Subgrupos do curriculo fixos durante a rolagem, com ajuste de ancoras para abrir cada bloco completo.
- Exportacao de curriculo em PDF respeitando modelo, cor e pretensao salarial selecionados.
- Configuracoes profissionais com grupos clicaveis e opcao de idioma local.
- Recuperacao de senha apontando para o dominio oficial da Vercel, com rota /auth/confirm para links por token hash.
- Recuperacao de senha agora registra tentativas em `email_logs`, usa Resend quando configurado e avisa quando cair no provedor padrao limitado do Supabase.
- Reenvio de confirmacao de cadastro pela pagina /confirm-email, com mensagens de erro do Supabase traduzidas para o usuario.
- Cadastro por email/senha cria usuarios ja confirmados via Supabase Admin API, removendo bloqueio por email de confirmacao na entrada inicial.
- Login com Google sem perfil cadastrado encerra a sessao local e volta ao login com mensagem clara, sem prender o usuario no cadastro.
- Onboarding possui acao visivel de sair da conta e rota dedicada `/auth/sign-out`.
- Cadastro empresarial aceita email corporativo opcional, usando o email de acesso como fallback quando necessario.
- Cadastro profissional permite digitar a data de nascimento em `dd/mm/aaaa`, com mascara e validacao, sem navegar manualmente pelo calendario.
- Callback de autenticacao e confirmacao automatica de emails antigos estao protegidos contra erro 500, redirecionando para mensagens controladas no login.
- Pagina `/confirm-email` tenta liberar o acesso diretamente via Supabase Admin API antes de usar reenvio de email do Supabase.
- Recuperacao de senha trata limite de 1 minuto do Supabase como solicitacao recente, sem exibir erro vermelho de falha.
- Auditoria do login corrigiu escrita de cookies em Server Components, validacao de env do Supabase, logs de auth e falhas do proxy.
- Proxy usa `maybeSingle()` para roles, trata usuario sem role/perfil via onboarding e evita erro 500 em rotas protegidas.
- Aliases `/profissional` e `/empresa` redirecionam para `/professional` e `/company`.
- Login com Google pela tela de entrar encaminha contas sem cadastro completo ao onboarding, preservando a sessao.
- Inicio do Google OAuth redireciona fora do `try/catch`, evitando que a excecao interna do Next.js seja tratada como falha de login.
- Metadados editaveis do usuario nao podem mais conceder papel administrativo no callback nem no trigger de novo usuario.
- Perfil da empresa passou a aceitar campos complementares sem obrigatoriedade e preserva os dados ja existentes quando o usuario salva campos em branco.
- Preferencia de idioma agora atualiza a interface autenticada com persistencia no banco, traducao no menu e tradutor em tempo de execucao para textos principais.
- Tradutor em tempo de execucao nao reprocessa mais o mesmo texto em ciclo; troca de idioma na area empresarial permanece responsiva.
- Area profissional ganhou a aba `/professional/search-demands` para listar todas as demandas abertas com empresa, local e modalidade.
- Catalogo profissional carrega todas as demandas ativas/em triagem por uma leitura server-side autorizada, sem depender de divergencias locais de RLS.
- Criacao, edicao e cancelamento de demanda agora invalidam imediatamente as telas profissional e publica.
- Corrigida divergencia do banco de producao que removia todas as demandas da interface ao consultar `companies.segment` e `companies.description` inexistentes.
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
- Aplicar a migration `20260618012733_harden_auth_role_metadata.sql` no Supabase de producao junto com o proximo deploy.
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
- As correcoes de perfil/curriculo passaram em `npm run lint` e no build de producao do Next.js 16.2.7.
- A falha de salvar perfil/curriculo foi rastreada para `ERROR 42P17: infinite recursion detected in policy for relation "professionals"`; o SQL corretivo foi versionado, aplicado no banco remoto e validado simulando o usuario profissional afetado.
- A confirmacao por email nao e mais exigida para novos cadastros por email/senha; recuperacao de senha ainda depende de Supabase Auth ou Resend configurado.
- O limite de reenvio de recuperacao do Supabase continua existindo na API externa; a interface agora comunica como pedido recente e nao como quebra.
- A auditoria local encontrou `SUPABASE_SERVICE_ROLE_KEY` invalida para Admin API; o login por email/senha com anon key foi validado contra o Supabase e retorna erros controlados.
- O deploy em producao ocorre pelo reposititorio GitHub conectado; esta tarefa nao altera configuracoes da Vercel.
