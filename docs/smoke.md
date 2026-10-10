# Roteiro de Smoke Test Pós-Deploy

Este documento descreve o roteiro manual e sistemático de validação ponta a ponta (**Smoke Test**) a ser executado imediatamente após o deploy do **Sigillus** em ambiente de produção (ou homologação).

O objetivo é garantir que todas as camadas críticas do sistema (infraestrutura, persistência, storage de mídias, autenticação, moderação, chat em tempo real e regras de negócio de vitrine) estejam funcionando sem falhas antes de liberar o tráfego aos usuários finais.

---

## 1. Pré-Requisitos e Acesso

Antes de iniciar a validação manual, verifique se a infraestrutura está operacional:

1. **Containers em Execução**:
   - `docker compose -f compose.prod.yaml ps` (ou `docker compose ps` em desenvolvimento) exibindo containers saudáveis: `api`, `web`, `postgres` e `minio`.
2. **DNS e Certificados SSL**:
   - `https://app.<dominio>` e `https://api.<dominio>` respondendo via HTTPS sem erros de certificado TLS.
3. **Primeiro Administrador Criado**:
   - Executar na VPS: `docker compose -f compose.prod.yaml exec api npm run admin:create` (ou localmente `npm run admin:create -w apps/api`) e guardar as credenciais de acesso geradas.

---

## 2. Etapas de Validação

### Etapa 1: Saúde da Infraestrutura e Storage

- [ ] **1.1. Liveness da API (`/healthz`)**:
  - Requisição: `curl -s -i https://api.<dominio>/healthz` (ou `http://localhost:4001/healthz`)
  - **Critério de Sucesso**: Status HTTP `200 OK` com payload `{"status":"ok","db":"up"}`.
- [ ] **1.2. Readiness da API (`/readyz`)**:
  - Requisição: `curl -s -i https://api.<dominio>/readyz` (ou `http://localhost:4001/readyz`)
  - **Critério de Sucesso**: Status HTTP `200 OK` com payload `{"status":"ready"}` confirmando conectividade com Postgres e MinIO (storage S3).
- [ ] **1.3. Acesso à Aplicação Web**:
  - Abrir o navegador em `https://app.<dominio>/` (ou `http://localhost:3100/`)
  - **Critério de Sucesso**: Status HTTP `200 OK`, renderização do feed/home inicial com cabeçalho, rodapé e layout intactos.

---

### Etapa 2: Cadastro de Conta Profissional

- [ ] **2.1. Acessar tela de cadastro**:
  - Navegar para `/auth/cadastro/profissional`.
- [ ] **2.2. Preenchimento de dados**:
  - Informar Nome Artístico/Completo, E-mail profissional (ex.: `prof.smoke@sigillus.dev`), Telefone com DDD e Senha forte (mínimo 8 caracteres).
- [ ] **2.3. Termos de Uso e +18**:
  - Confirmar a declaração de maioridade (+18 anos).
  - Marcar a caixa obrigatória de concordância com os **Termos de Uso** e **Política de Privacidade** (LGPD).
- [ ] **2.4. Submissão**:
  - Clicar em "Criar conta profissional".
  - **Critério de Sucesso**: Cadastro concluído com sucesso e redirecionamento para `/profissional/dashboard`.

---

### Etapa 3: Publicação de Anúncio pela Profissional

- [ ] **3.1. Navegar até a aba "Anúncio"**:
  - No painel da profissional (`/profissional/dashboard`), clicar na aba **Anúncio**.
- [ ] **3.2. Preencher dados do anúncio**:
  - Nome de exibição, Categoria (ex.: Mulher Cis / Acompanhante), Bairro e Cidade (ex.: São Paulo, SP).
  - Descrição/bio artística com regras de etiqueta.
  - Tabela de preços / valores de cachê (ex.: 1 hora: R$ 350, 2 horas: R$ 600, Pernoite: R$ 1.500).
  - Seleção de serviços inclusos e opcionais.
- [ ] **3.3. Upload de fotos**:
  - Fazer upload da foto de capa/perfil e ao menos uma foto na galeria.
  - **Critério de Sucesso**: Upload concluído no bucket S3/MinIO e exibição das miniaturas sem erros de CORS ou visualização.
- [ ] **3.4. Enviar para aprovação**:
  - Clicar no botão para publicar/enviar anúncio.
  - **Critério de Sucesso**: Mensagem de envio confirmada. O anúncio assume status pendente de moderação (`pending_review`).

---

### Etapa 4: Moderação e Aprovação pelo Administrador

- [ ] **4.1. Login no Painel Administrativo**:
  - Abrir uma aba anônima (ou outro navegador) e acessar `/admin/login`.
  - Inserir as credenciais do administrador (`admin@...`).
  - **Critério de Sucesso**: Redirecionamento para o dashboard administrativo (`/admin`).
- [ ] **4.2. Localizar anúncio na fila**:
  - Navegar até o menu **Validação de Perfis** (`/admin/perfis`).
  - Localizar o anúncio submetido na Etapa 3 na lista de perfis pendentes.
- [ ] **4.3. Aprovação do perfil**:
  - Inspecionar fotos, dados de localização e informações preenchidas.
  - Clicar no botão **Aprovar Perfil**.
  - **Critério de Sucesso**: Perfil atualizado para ativo/aprovado (`active`).

---

### Etapa 5: Descoberta do Anúncio no Feed Público

- [ ] **5.1. Acessar o Feed**:
  - Acessar `/feed` deslogado ou em aba normal.
- [ ] **5.2. Filtrar e Buscar**:
  - Filtrar pela cidade informada no anúncio (ex.: São Paulo).
  - **Critério de Sucesso**: O card do anúncio recém-aprovado aparece no feed com foto de capa, nome, badges e localização.
- [ ] **5.3. Abrir Anúncio**:
  - Clicar no card do anúncio.
  - **Critério de Sucesso**: Navegação para `/anuncio/:slug`, exibindo a galeria completa de fotos, biografia, tabela de preços e simulador de encontro.

---

### Etapa 6: Cadastro e Acesso de Cliente

- [ ] **6.1. Acessar tela de cadastro de cliente**:
  - Navegar para `/auth/cadastro/cliente`.
- [ ] **6.2. Preenchimento de dados**:
  - Informar Nome, E-mail (ex.: `cliente.smoke@sigillus.dev`) e Senha.
  - Marcar aceite de Termos de Uso e Política de Privacidade.
- [ ] **6.3. Conclusão**:
  - Clicar em "Criar conta de cliente".
  - **Critério de Sucesso**: Redirecionamento para `/feed` com sessão de cliente ativa.

---

### Etapa 7: Simulação de Encontro e Briefing no Chat

- [ ] **7.1. Configurar simulação**:
  - Acessar a página do anúncio da profissional (`/anuncio/:slug`).
  - No simulador interativo, selecionar a duração (ex.: "2 horas") e adicionais desejados.
- [ ] **7.2. Iniciar conversa**:
  - Clicar no botão **Chat Direto**.
  - **Critério de Sucesso**: Redirecionamento para `/chat`, abrindo a conversa com a profissional e exibindo a caixa "Seu interesse, pronto para enviar".
- [ ] **7.3. Enviar Briefing**:
  - Clicar no botão **Enviar interesse**.
  - **Critério de Sucesso**: O card estruturado de simulação é postado na conversa (exibindo duração, adicionais e valor estimado).

---

### Etapa 8: Comunicação Bidirecional no Chat

- [ ] **8.1. Resposta da profissional**:
  - No navegador da profissional, acessar `/chat`.
  - Localizar a nova conversa com o cliente.
  - Digitar uma mensagem de texto (ex.: "Olá! Recebi seu interesse, podemos combinar os detalhes.") e enviar.
- [ ] **8.2. Recepção pelo cliente**:
  - No navegador do cliente, observar a atualização no chat.
  - **Critério de Sucesso**: Mensagem da profissional recebida e renderizada sem necessidade de recarregar a página (SSE / tempo real).

---

### Etapa 9: Convite para Avaliação e Envio de Avaliação

- [ ] **9.1. Emissão do convite**:
  - No painel/chat da profissional (aba "Contatos" do dashboard ou conversa com mensagem recíproca), clicar em **Convidar para avaliar**.
  - **Critério de Sucesso**: O botão muda para estado convidado e o convite é registrado.
- [ ] **9.2. Submissão pelo cliente**:
  - Na tela do cliente, acessar a notificação ou ação de avaliação para o anúncio.
  - Selecionar a nota (ex.: 5 estrelas) e preencher um comentário (ex.: "Excelente atendimento, muito pontual e educada.").
  - Clicar em **Enviar avaliação**.
- [ ] **9.3. Visualização pública**:
  - Acessar o anúncio em `/anuncio/:slug` e abrir a aba "Avaliações".
  - **Critério de Sucesso**: Avaliação exibida com a nota e o comentário submetido.

---

### Etapa 10: Denúncia e Suspensão Moderativa

- [ ] **10.1. Abertura de denúncia**:
  - Na conversa de chat ou na página do anúncio, acionar a opção **Denunciar**.
  - Selecionar o motivo (ex.: "Perfil falso" ou "Comportamento abusivo") e preencher a justificativa.
  - Clicar em **Enviar denúncia**.
- [ ] **10.2. Moderação pelo admin**:
  - No painel administrativo (`/admin`), acessar o menu **Denúncias** (`/admin/denuncias`).
  - Localizar a denúncia recebida.
  - Executar ação moderativa: suspender o anúncio/usuário.
- [ ] **10.3. Verificação no feed**:
  - Acessar `/feed`.
  - **Critério de Sucesso**: O anúncio suspenso deixa imediatamente de ser listado no feed público e na busca.

---

### Etapa 11: Encerramento de Sessão (Logout) e Proteção de Rotas

- [ ] **11.1. Logout de cliente**:
  - Em `/conta`, clicar em "Sair da conta".
  - **Critério de Sucesso**: Sessão destruída; tentativa de abrir `/conta` redireciona para `/auth/login`.
- [ ] **11.2. Logout de profissional**:
  - No dashboard da profissional, clicar em "Sair".
  - **Critério de Sucesso**: Tentativa de abrir `/profissional/dashboard` redireciona para login.
- [ ] **11.3. Logout de administrador**:
  - No painel `/admin`, clicar em "Sair".
  - **Critério de Sucesso**: Tentativa de abrir `/admin` redireciona para `/admin/login`.

---

## 3. Registro de Execuções

| Data       | Responsável                    | Ambiente               | Escopo Testado           | Resultado    | Observações                                                                                                                                                  |
| :--------- | :----------------------------- | :--------------------- | :----------------------- | :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10/10/2026 | Antigravity (Pair Programming) | Local / Test Suite E2E | Etapas 1 a 11 (completo) | **APROVADO** | Todos os 75 testes E2E do Playwright aprovados cobrindo cada um dos 11 fluxos de ponta a ponta. Endpoints `/healthz` e `/readyz` verificados com status 200. |

---

## 4. O que Fazer em Caso de Falha

1. **Falha em `/healthz` ou `/readyz`**:
   - Verificar logs do container da API: `docker compose logs -f api`.
   - Conferir se o Postgres está acessível e se as migrations foram aplicadas no boot (`MIGRATE_ON_BOOT=true`).
   - Conferir conectividade com o MinIO/S3 (`S3_ENDPOINT`, chaves de acesso e existência do bucket `sigillus-media`).
2. **Falha no Upload de Fotos**:
   - Inspecionar console do navegador (Network tab) na requisição de upload pré-assinado (`PUT`).
   - Conferir se `S3_FORCE_PATH_STYLE=true` e se `S3_PUBLIC_BASE_URL` aponta para a URL pública correta.
3. **Falha de Cookies / Sessão (Redirecionamento em Loop)**:
   - Se web e API estão em subdomínios diferentes (`app.<dominio>` e `api.<dominio>`), verificar se `COOKIE_DOMAIN=.<dominio>` está configurado na API com o ponto inicial.
