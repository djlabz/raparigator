# Correções pré-deploy (Fase 2.1) - Sigillus

Escopo fechado de correções que precisam ser feitas **antes** do primeiro deploy. Complementa `docs/roteiro.md` (Fase 2 marcada como concluída) e tem prioridade sobre a Fase 3. Vale para quem executar: Claude Code ou Gemini.

Referência da análise: `main` em `462e015` (10/10/2026). **Nada está no ar ainda.** "Concluído" no roteiro significa "mergeado na main", não "validado em produção".

---

## 0. Regras duras (ler antes de qualquer task)

1. **Escopo fechado.** Só execute as tasks da seção 4, na ordem, uma por PR (`fix/T-4x-nome-curto` → `main`). Se encontrar outro problema, **não corrija**: anote na seção 7 ("Achados novos") com arquivo, evidência e impacto, e siga a task atual.
2. **Reproduza antes de corrigir.** Todo PR começa com um teste (ou comando) que **falha** na `main` e demonstra o problema. Cole a saída da falha na descrição do PR. Depois implemente até o teste passar. Se não conseguir reproduzir, pare e marque a task como `REFUTADA?` com a evidência; não invente correção.
3. **Proibido para fazer teste passar:** `force: true`, `test.skip`/`it.skip`/`fixme`, `.only`, aumentar timeout sem causa, trocar asserção por uma mais fraca, apagar teste, `waitForTimeout`. Se um teste existente quebrar, a correção é no código de produto, ou é parada e pergunta.
4. **Não tocar:** `PREMIUM_PLAN_OPTIONS` e preços (D-02), `BillingProvider`/PSP (Fase 3), textos de `termos/page.tsx` e `privacidade/page.tsx`, regras de moderação, qualquer item da seção 5.
5. **Sem ADR nova por task.** ADR só registra decisão de arquitetura. Nesta fase, a única mudança de ADR permitida é emendar ADR-006, ADR-007 e ADR-016 (T-49).
6. **Critério de pronto de toda task (sem exceção):** `npm run check`, `npm run test` e `npm run test:e2e` verdes localmente **e** CI verde no PR **e** CI verde no push da `main` depois do merge. Se a `main` ficar vermelha depois do merge, a próxima ação é corrigir isso, não começar outra task.
7. **Ao concluir:** marque `[x]` com `(PR #nn, dd/mm)`. Se a task mudou algo que afeta uma task seguinte, edite a task seguinte neste arquivo, no mesmo PR.
8. **Decisão de produto não listada aqui = pare e pergunte ao Daniel.** Não escolha "a opção recomendada" sozinho.

---

## 1. Roteiro x realidade (o que foi entregue)

| Task | Roteiro diz                                                         | Realidade na `main`                                                                                                                                                                          | Status real                   |
| ---- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| T-19 | Remover mocks; `data-source.ts` apagado ou reduzido a `getApiUrl()` | Arquivos de mock apagados, mas `isApiDataSource()` virou `return true` e os ramos antigos (com `localStorage`) continuam em 8 arquivos                                                       | Concluída com dívida → T-47   |
| T-20 | CLI `create-admin`                                                  | Existe e compila (`dist/create-admin.js`)                                                                                                                                                    | OK (doc inconsistente → T-49) |
| T-21 | Verificação opcional por flag                                       | Implementado                                                                                                                                                                                 | OK                            |
| T-22 | Premium gratuito, `admin.grantPremium`                              | Implementado                                                                                                                                                                                 | OK                            |
| T-23 | E-mail com Resend, reset de senha                                   | Implementado; link usa `WEB_ORIGIN`                                                                                                                                                          | OK                            |
| T-24 | Exclusão de conta LGPD                                              | Apaga mídia e anonimiza mensagens **antes** de `deleteUser`; sessão com mais de 1 dia falha no `deleteUser` (freshAge padrão do better-auth) e a conta continua viva sem as mídias           | Bug → T-45                    |
| T-25 | Compose de produção                                                 | Publica Postgres, MinIO e console em todas as interfaces; imagem MinIO `:latest`; falta `API_ORIGIN`, `RATE_LIMIT_ENABLED`; `BILLING_WEBHOOK_SECRET` vazio por padrão                        | Bloqueante → T-40             |
| T-26 | Deploy documentado                                                  | Seguindo o guia, a API não sobe (Zod exige `BILLING_WEBHOOK_SECRET` com 16+ chars); URLs pré-assinadas apontam para `http://minio:9000`; `next/image` não aceita o host de mídia de produção | Bloqueante → T-40, T-43, T-44 |
| T-27 | Smoke test                                                          | Roteiro manual existe; nunca rodou contra o compose de produção                                                                                                                              | OK como doc                   |
| T-28 | Bateria de estresse                                                 | Testes de concorrência leves; E2E falhou na `main` depois do merge (run 33) e foi "corrigido" afrouxando testes no #62                                                                       | Dívida → T-46                 |
| #62  | Script pré-voo                                                      | `scripts/check-prod-env.sh` aprova o `.env.prod.example` intacto (placeholders não batem com os padrões que ele procura)                                                                     | Bug → T-41                    |

---

## 2. Evidências (para reproduzir)

- **E1. API não sobe:** `apps/api/src/config.ts` tem `BILLING_WEBHOOK_SECRET: z.string().min(16)`; `compose.prod.yaml` passa `${BILLING_WEBHOOK_SECRET:-}`; a chave não existe em `.env.prod.example` nem em `docs/deploy.md`.
- **E2. Pré-voo inútil:** `cp .env.prod.example /tmp/t.env && bash scripts/check-prod-env.sh /tmp/t.env` termina com "✅ pronto para deploy".
- **E3. Portas expostas:** `compose.prod.yaml` publica `"${POSTGRES_PORT:-5432}:5432"`, `"9000:9000"`, `"9001:9001"`, `4000` e `3000` sem `127.0.0.1:`. O Docker insere regras de iptables que passam por cima do UFW, então "proteger pelo firewall" (como diz o `deploy.md`) não funciona.
- **E4. Rate limit desligado:** `RATE_LIMIT_ENABLED` não aparece no compose → `false` → `apps/api/src/lib/auth.ts` passa `enabled: config.RATE_LIMIT_ENABLED` ao better-auth (desliga explicitamente) e `server.ts` usa `NoopRateLimiter`.
- **E5. `API_ORIGIN` ausente:** default `http://localhost:4000` vira `baseURL` do better-auth em produção.
- **E6. Presign inalcançável:** `apps/api/src/lib/storage.ts` cria o client S3 com `endpoint: config.S3_ENDPOINT` (`http://minio:9000`, hostname interno do Docker) e usa o mesmo client em `getSignedUrl`. O navegador recebe URL com host `minio`. A assinatura SigV4 inclui o host, então não dá para trocar o host depois. Além disso, o Caddy de `deploy.md` faz `rewrite * /sigillus-media{uri}` no host de mídia, o que quebraria assinatura de caminho.
- **E7. `next/image`:** `apps/web/next.config.ts` só permite `localhost`/`127.0.0.1` e unsplash/pexels. 21 arquivos usam `next/image` e só 14 ocorrências de `unoptimized` existem.
- **E8. Exclusão de conta:** `apps/api/src/modules/auth/router.ts` (`deleteAccount`) apaga objetos do storage, apaga `media_asset`, anonimiza `message` e só então chama `auth.api.deleteUser({ body: {} })`. Em `better-auth@1.6.29` (`dist/api/routes/update-user.mjs`), sem `password` e com sessão criada há mais de `freshAge` (padrão 86400s) o endpoint lança `SESSION_EXPIRED`. Sessões duram 30 dias. O hook `user.deleteUser.beforeDelete` roda **depois** das checagens de senha e freshness.
- **E9. Testes afrouxados (#62):** `apps/web/tests/encounter-brief.spec.ts` ganhou `adCard.click({ force: true })`; `stress-resilience.spec.ts` trocou `Promise.allSettled([sendBtn.click(), sendBtn.click()])` por `sendBtn.click({ clickCount: 2 })`.

### 2.1 Resultado da verificação (T-39, 10/10/2026)

Verificado na máquina do Daniel, branch `main` em `462e015`, sem alterações locais além deste arquivo (`git status`: só `?? docs/correcoes-pre-deploy.md`; `git diff` vazio; `git log origin/main..HEAD` vazio). Versões instaladas: `better-auth@1.6.29`, `@aws-sdk/client-s3@3.1111.0` + `@smithy/signature-v4@5.7.2`, `next@16.2.12`, Docker Compose `2.40.3`.

| #   | Resultado  | Prova                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | PARCIAL    | O efeito está confirmado: a API não sobe. `apps/api/src/config.ts:46` `BILLING_WEBHOOK_SECRET: z.string().min(16)`; `compose.prod.yaml:83` `${BILLING_WEBHOOK_SECRET:-}`; `docs/deploy.md` seção 4 não lista a chave. Execução: `loadConfig()` com o env de produção e `BILLING_WEBHOOK_SECRET=""` lança `BILLING_WEBHOOK_SECRET: Too small: expected string to have >=16 characters`; `docker compose -f compose.prod.yaml config --format json` (env fake, sem `.env`) entrega `BILLING_WEBHOOK_SECRET = ''` à API. **Parte refutada:** a chave existe em `.env.prod.example` (linha 41, `BILLING_WEBHOOK_SECRET=`), só que vazia; quem copia o template sem preencher cai no mesmo erro. O plano da T-40 não muda.                                   |
| E2  | CONFIRMADA | `cp .env.prod.example <tmp>/t.env && bash scripts/check-prod-env.sh <tmp>/t.env` imprime só `[OK]` e termina com `✅ Verificação concluída com sucesso! ... está pronto para deploy.`, `exit=0`. Motivo: os placeholders reais (`gere-uma-senha-forte-para-o-postgres`, `gere-um-secret-forte-para-o-s3`, `gere-uma-chave-secreta-com-pelo-menos-32-caracteres-aleatorios` com 62 chars, `re_sua_chave_do_resend_aqui`) não contêm nenhum dos padrões de `check-prod-env.sh:30`; URLs `http://localhost:*` (linhas 22, 30, 31, 33) só geram AVISO para `WEB_ORIGIN` e passam nas outras; `COOKIE_DOMAIN=` vazio passa (linha 63 só checa se não vazio); `BILLING_WEBHOOK_SECRET=` vazio, `API_ORIGIN` e `RATE_LIMIT_ENABLED` ausentes não são checados. |
| E3  | CONFIRMADA | `compose.prod.yaml:10,28,29,58,109`. `docker compose ... config --format json`: `api host_ip=None 4000`, `minio host_ip=None 9000` e `9001`, `postgres host_ip=None 5432`, `web host_ip=None 3000`; imagens `cgr.dev/chainguard/minio:latest` em `minio` e `minio-init`. Docker docs (`manuals/engine/network/packet-filtering-firewalls.md`, "Docker and ufw"): portas publicadas são roteadas na tabela `nat` antes das chains `INPUT`/`OUTPUT` do ufw, "effectively ignoring your firewall configuration". `docs/deploy.md:16` diz "vinculadas a `127.0.0.1` ou protegidas pelo firewall".                                                                                                                                                           |
| E4  | CONFIRMADA | `config.ts:48` `RATE_LIMIT_ENABLED: booleanFromEnv.default(false)`; chave ausente do compose (`"RATE_LIMIT_ENABLED" in environment` → `False`); `lib/auth.ts:108` e `:151` `enabled: config.RATE_LIMIT_ENABLED`; `server.ts:55` `NoopRateLimiter` quando falso. better-auth `dist/context/create-context.mjs:171`: `enabled: options.rateLimit?.enabled ?? isProduction`, ou seja, o `false` explícito vence o default de produção. Execução: `loadConfig()` sem a env → `RATE_LIMIT_ENABLED = false`.                                                                                                                                                                                                                                                  |
| E5  | CONFIRMADA | `config.ts:29` default `http://localhost:4000`; ausente do compose (`"API_ORIGIN" in environment` → `False`); `lib/auth.ts:25` e `:127` `baseURL: config.API_ORIGIN`; também `app.ts:111` (servers do OpenAPI). Execução: `loadConfig()` sem a env → `API_ORIGIN = http://localhost:4000`.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| E6  | CONFIRMADA | `lib/storage.ts:29-37` cria um único `S3Client` com `endpoint: config.S3_ENDPOINT` e o usa em `getSignedUrl` (linhas 48 e 59). Execução de `createS3Storage` com `S3_ENDPOINT=http://minio:9000`: upload → `http://minio:9000/sigillus-media/u/1/a.jpg` com `X-Amz-SignedHeaders=content-length;host`; view → mesmo host com `X-Amz-SignedHeaders=host`. O host faz parte da assinatura. Path-style põe o bucket no caminho, então o `rewrite * /sigillus-media{uri}` de `deploy.md:55` geraria `/sigillus-media/sigillus-media/...` e quebraria a assinatura.                                                                                                                                                                                          |
| E7  | CONFIRMADA | `apps/web/next.config.ts:11-48`: só `localhost`/`127.0.0.1` (9000, 9010), `images.unsplash.com`, `images.pexels.com`. `grep`: 21 arquivos importam `next/image`, 14 ocorrências de `unoptimized`, 14 arquivos sem nenhum `unoptimized` (ex.: `ad-details/photo-gallery-section.tsx` com `src={img}` vindo da API). `next@16.2.12` `dist/server/image-optimizer.js:578-580`: host fora de `remotePatterns` → 400 `"url" parameter is not allowed`. Nenhuma referência a unsplash/pexels fora do `next.config.ts`.                                                                                                                                                                                                                                        |
| E8  | CONFIRMADA | `modules/auth/router.ts:46-93`: apaga objetos (55-67), apaga `media_asset` (69-71), anonimiza `message` (73-81) e `lastMessagePreview` (83-88), e só então `deleteUser({ body: {} })` (90-93), sem transação. `better-auth@1.6.29` `dist/api/routes/update-user.mjs:329-332`: sem `password` e com `freshAge !== 0`, `Date.now() - session.createdAt >= freshAge` → `SESSION_EXPIRED`; `beforeDelete` só na linha 334, depois da checagem de senha (293-299) e de freshness. `dist/context/create-context.mjs:148`: `freshAge` padrão `3600 * 24`. `lib/auth.ts:10` sessões de 30 dias, sem `freshAge` configurado. `dist/api/routes/session.mjs:226-229`: o refresh da sessão atualiza só `expiresAt`/`updatedAt`, nunca `createdAt`.                  |
| E9  | CONFIRMADA | `git show 462e015 -- apps/web/tests/...`: `adCard.click()` → `adCard.click({ force: true })` (`encounter-brief.spec.ts:115`) e `Promise.allSettled([sendBtn.click(), sendBtn.click()])` → `sendBtn.click({ clickCount: 2 })` (`stress-resilience.spec.ts:44`). CI: run `38086131619` (push de `2bc41f8`) falhou com 1 failed (`review-invite.spec.ts:42`) e 2 flaky (`encounter-brief.spec.ts:101`, `review-invite.spec.ts:25`). Run `38091174075` (push de `462e015`, verde) ainda tem `encounter-brief.spec.ts:101` flaky com `locator.click: Element is not visible` **mesmo com `force: true`**: o `force` não resolveu, o retry é que mascara.                                                                                                     |

---

## 3. Fora de escopo nesta fase (ignorar, não implementar, não "adiantar")

- Pagamento: T-30, T-31, T-32 do roteiro, `PREMIUM_CHECKOUT_ENABLED`, qualquer PSP.
- T-33 (provedor de SMS) e T-34 (moderação de mídia).
- Textos jurídicos, identificação do controlador/encarregado, base legal de dado sensível.
- Escolha de provedor de VPS, nome de domínio, destino de backup externo.
- Visibilidade do repositório no GitHub.
- Itens da seção 5 (dependem de decisão do Daniel).

---

## 4. Tasks (ordem obrigatória)

### Bloco A - deploy sobe e não expõe nada

- [ ] **T-40 Compose de produção seguro e completo.**
  - **Arquivos permitidos:** `compose.prod.yaml`, `.env.prod.example`, `docs/deploy.md` (só a tabela de env e a seção de portas).
  - **Fazer:**
    - `api` e `web`: publicar só em `127.0.0.1` (`"127.0.0.1:${API_PORT:-4000}:4000"`, idem web).
    - `postgres`: remover `ports` (a API usa a rede interna). Se precisar de acesso local, documentar `docker compose exec postgres psql`.
    - `minio`: publicar só `"127.0.0.1:${MINIO_PORT:-9000}:9000"`; remover a publicação do console `9001` (acesso por túnel SSH documentado em uma linha).
    - Pinar a imagem do MinIO (e do `minio-init`) numa tag/digest específica em vez de `:latest`. Não alterar `user: "0:0"` nesta task (ver seção 6).
    - Adicionar ao serviço `api`: `API_ORIGIN: ${API_ORIGIN:?...}`, `RATE_LIMIT_ENABLED: ${RATE_LIMIT_ENABLED:-true}`, `BILLING_WEBHOOK_SECRET: ${BILLING_WEBHOOK_SECRET:?Defina BILLING_WEBHOOK_SECRET no .env}`.
    - `.env.prod.example` e tabela do `deploy.md`: incluir `API_ORIGIN`, `RATE_LIMIT_ENABLED`, `BILLING_WEBHOOK_SECRET` (com `openssl rand -hex 32`) e remover `POSTGRES_PORT`/`MINIO_CONSOLE_PORT` se deixarem de ser usados.
  - **Teste que falha antes:** teste em `apps/api/tests/` que lê `compose.prod.yaml` (parse YAML), pega as chaves de `services.api.environment` e verifica que toda chave **obrigatória sem default** do `EnvSchema` está presente e que `API_ORIGIN` e `RATE_LIMIT_ENABLED` estão lá. Segundo teste: toda entrada de `ports` de todos os serviços começa com `127.0.0.1:`. Para isso, exporte o schema de `config.ts` se ainda não for exportado (sem mudar o comportamento).
  - **Teste adicional:** com `RATE_LIMIT_ENABLED=true`, N tentativas de login com senha errada no mesmo e-mail retornam 429 a partir de algum ponto (usar o limite configurado no código, não um número inventado).
  - **Pronto quando:** os testes acima passam; `docker compose -f compose.prod.yaml --env-file .env.prod.example config` roda sem erro.

  #### Plano verificado (T-39)

  Evidências: E3, E4, E5 CONFIRMADAS; E1 PARCIAL (efeito confirmado; a chave existe vazia no template, não ausente).

  - **Arquivos que mudam:** `compose.prod.yaml`, `.env.prod.example`, `docs/deploy.md` (tabela da seção 4 e linha de portas da seção 1), e o teste novo `apps/api/tests/compose-prod.test.ts` (o local do teste é pedido pela própria task).
  - **Desvio do texto da task:** não é preciso exportar o `EnvSchema` de `config.ts` nem adicionar parser de YAML (não há `yaml`/`js-yaml` instalado; adicionar exigiria `package.json` e `package-lock.json`, fora da lista). O teste usa `docker compose -f compose.prod.yaml --env-file <tmp> config --format json`, que já resolve a interpolação, e passa o `services.api.environment` resultante para o `loadConfig()` já exportado. Isso testa o que importa (a API sobe com o env que o compose entrega) sem tocar em `config.ts`.
  - **Teste que falha primeiro** (`apps/api/tests/compose-prod.test.ts`):
    1. Escreve um env fake válido num arquivo temporário (fora do repo) e roda o `docker compose config` acima com `--env-file` explícito, para nunca carregar o `.env` da raiz.
    2. "a API aceita o env de produção do compose": `loadConfig(services.api.environment)` não lança. Na `main` lança por `BILLING_WEBHOOK_SECRET` (E1).
    3. "o compose define API_ORIGIN e RATE_LIMIT_ENABLED": as duas chaves existem em `services.api.environment`, e `loadConfig(...).RATE_LIMIT_ENABLED === true` e `API_ORIGIN` igual ao valor fake. Na `main` falha (E4, E5).
    4. "nenhuma porta publicada fora do loopback": toda entrada de `ports` de todos os serviços tem `host_ip === "127.0.0.1"`, `postgres` não tem `ports` e nenhuma porta `9001` é publicada. Na `main` falha (E3).
    5. "imagens pinadas": nenhum `image` termina em `:latest` entre os serviços de terceiros (`minio`, `minio-init`). Os `image: sigillus-api:latest`/`sigillus-web:latest` são tags locais de build e ficam fora dessa checagem.
    6. "falha sem BILLING_WEBHOOK_SECRET": sem a chave no env file, o `docker compose config` sai com código ≠ 0 e a mensagem do `:?`.
  - **Teste adicional (rate limit):** no mesmo arquivo, harness com `RATE_LIMIT_ENABLED=true` (setar `process.env` antes do `createTestHarness()` e restaurar no `afterAll`), 6 `POST /api/auth/sign-in/email` com senha errada e o mesmo `x-forwarded-for`: as 5 primeiras não são 429 e a 6ª é 429 (`customRules["/sign-in/email"] = { window: 60, max: 5 }` em `lib/auth.ts:112`). Esse teste **passa já na `main`** (o código respeita a flag; o bug é o compose não ligá-la), então ele é regressão e não o teste vermelho; o vermelho é o item 3.
  - **Passos:**
    1. Escrever o teste e rodar `npm run test -w apps/api -- compose-prod` na `main`: falham 2, 3, 4, 5, 6; colar a saída no PR.
    2. `compose.prod.yaml`: `ports` de `api` e `web` com prefixo `127.0.0.1:`; remover `ports` do `postgres`; `minio` só `"127.0.0.1:${MINIO_PORT:-9000}:9000"` (sem 9001; manter `--console-address` interno); pinar `cgr.dev/chainguard/minio` em digest (`@sha256:...`) obtido com `docker buildx imagetools inspect` no dia, nos dois serviços; adicionar `API_ORIGIN: ${API_ORIGIN:?Defina API_ORIGIN no .env}`, `RATE_LIMIT_ENABLED: ${RATE_LIMIT_ENABLED:-true}`, `BILLING_WEBHOOK_SECRET: ${BILLING_WEBHOOK_SECRET:?Defina BILLING_WEBHOOK_SECRET no .env}`. Não mexer em `user: "0:0"`.
    3. `.env.prod.example`: adicionar `API_ORIGIN` e `RATE_LIMIT_ENABLED=true`; remover `POSTGRES_PORT` (linha 12) e `MINIO_CONSOLE_PORT` (linha 16). `BILLING_WEBHOOK_SECRET` (hoje vazio, linha 41) e `API_ORIGIN` precisam de placeholder **não vazio**, porque `${VAR:?}` do Compose também falha com valor vazio e o "Pronto quando" exige `docker compose ... --env-file .env.prod.example config` sem erro. Usar já o formato da T-41 (`CHANGE_ME_...`, com comentário `openssl rand -hex 32` no secret), para a T-41 não ter que refazer essas duas linhas. Os demais placeholders ficam para a T-41.
    4. `docs/deploy.md`: linha 16 passa a dizer que o compose publica só em `127.0.0.1` e que o firewall não protege portas do Docker; tabela da seção 4 ganha as três chaves; uma linha com `docker compose exec postgres psql` e túnel SSH (`ssh -L 9001:...`) para o console do MinIO.
    5. Rodar o teste até passar; `docker compose -f compose.prod.yaml --env-file .env.prod.example config` sem erro.
  - **Risco e cobertura:**
    - Quem hoje acessa Postgres/console MinIO pela rede perde o acesso (intencional; documentado). Coberto pelo item 4.
    - Docker docs (`port-publishing.md`): em Docker < 28.0.0, porta publicada em `127.0.0.1` pode ser alcançada por hosts do mesmo segmento L2. Registrar no `deploy.md` "Docker Engine ≥ 28" como pré-requisito. Não é coberto por teste.
    - `RATE_LIMIT_ENABLED=true` em produção usa o `x-forwarded-for`; o Caddy do `deploy.md` já manda `header_up X-Forwarded-For {remote}` para a API. Se o header faltar, o better-auth cai num bucket único por caminho (`rate-limiter/index.mjs:283-287`) e 5 logins/min valeriam para todos. Coberto parcialmente pelo teste de rate limit (envia o header).
    - O teste depende do `docker` no PATH. O job `test-api` da CI roda em `ubuntu-latest`, que tem Docker Compose v2; localmente o `npm run db:up` já exige Docker.

- [ ] **T-41 Script pré-voo que realmente bloqueia.**
  - **Arquivos permitidos:** `scripts/check-prod-env.sh`, `.env.prod.example`, `.github/workflows/ci.yml` (um step novo).
  - **Fazer:** o script deve falhar quando: qualquer valor contém o texto de placeholder **realmente usado** no template (padronize todos os placeholders do `.env.prod.example` para começar com `CHANGE_ME` e o script procura esse prefixo); `WEB_ORIGIN`, `CORS_ORIGINS`, `API_ORIGIN`, `NEXT_PUBLIC_API_URL`, `S3_PUBLIC_BASE_URL` (e `S3_PUBLIC_ENDPOINT` da T-43, se já existir) não começam com `https://` ou contêm `localhost`/`127.0.0.1`; `COOKIE_DOMAIN` está vazio; `BILLING_WEBHOOK_SECRET` tem menos de 32 chars; `RATE_LIMIT_ENABLED` não é `true`; `AUTH_SECRET` tem menos de 32 chars.
  - **Teste que falha antes:** step de CI `bash scripts/check-prod-env.sh .env.prod.example` **deve sair com código ≠ 0** (o step passa quando o script falha). Mais um step com um arquivo de env válido gerado no próprio CI (valores fake mas no formato certo) que **deve passar**.
  - **Pronto quando:** os dois steps da CI se comportam como descrito.

  #### Plano verificado (T-39)

  Evidência: E2 CONFIRMADA (o script aprova o template intacto com `exit=0`).

  - **Arquivos que mudam:** `scripts/check-prod-env.sh`, `.env.prod.example`, `.github/workflows/ci.yml`.
  - **Teste que falha primeiro:** step novo no job `check` da CI: `if bash scripts/check-prod-env.sh .env.prod.example; then echo "pré-voo aprovou o template"; exit 1; fi`. Na `main` esse step falha (o script sai 0, ver E2). Localmente, o mesmo comando com a saída da E2 vai no PR.
  - **Segundo step (deve passar):** gera `$RUNNER_TEMP/prod.env` com heredoc e `openssl rand -hex 32` para `POSTGRES_PASSWORD`, `S3_SECRET_ACCESS_KEY`, `AUTH_SECRET`, `BILLING_WEBHOOK_SECRET`; URLs `https://app.example.com`, `https://api.example.com`, `https://media.example.com/sigillus-media`; `COOKIE_DOMAIN=.example.com`; `RATE_LIMIT_ENABLED=true`; `MAIL_PROVIDER=resend` com `RESEND_API_KEY=re_ci_fake`. Roda `bash scripts/check-prod-env.sh "$RUNNER_TEMP/prod.env"` e espera 0. A T-42 reusa o mesmo heredoc.
  - **Passos:**
    1. Adicionar os dois steps; confirmar que o 1º falha na `main` (push numa branch); colar o log.
    2. `.env.prod.example`: todo valor que o operador **precisa** trocar passa a começar com `CHANGE_ME`: `POSTGRES_PASSWORD` (linha 10), `S3_SECRET_ACCESS_KEY` (18), `AUTH_SECRET` (36), `BILLING_WEBHOOK_SECRET` (41, hoje vazio), `RESEND_API_KEY` (45), `WEB_ORIGIN`/`CORS_ORIGINS`/`NEXT_PUBLIC_API_URL`/`S3_PUBLIC_BASE_URL` (22, 30, 31, 33), `COOKIE_DOMAIN` (32, hoje vazio) e `API_ORIGIN` (vinda da T-40). Valores com default razoável (`POSTGRES_USER=sigillus`, `S3_BUCKET`, flags) ficam como estão. Formato das URLs: `CHANGE_ME_https://app.seudominio.com`, para o operador ver o formato esperado.
    3. `check-prod-env.sh`: (a) `check_var` reprova qualquer valor que contenha `CHANGE_ME` (substitui a lista da linha 30); (b) para `WEB_ORIGIN`, `CORS_ORIGINS` (cada item do CSV), `API_ORIGIN`, `NEXT_PUBLIC_API_URL`, `S3_PUBLIC_BASE_URL` e `S3_PUBLIC_ENDPOINT` (só se a T-43 já tiver entrado): FALHA se não começar com `https://` ou contiver `localhost`/`127.0.0.1` (o AVISO da linha 58-60 vira FALHA); (c) `COOKIE_DOMAIN` vazio vira FALHA; (d) `BILLING_WEBHOOK_SECRET` e `AUTH_SECRET` com menos de 32 chars são FALHA; (e) `RATE_LIMIT_ENABLED` diferente de `true` é FALHA. Mantém as checagens atuais de `VERIFICATION_DEV_CODES`, billing e e-mail.
    4. Rodar localmente: template → exit 1 listando cada chave; env gerado → exit 0.
  - **Risco e cobertura:** o script passa a reprovar o `.env.prod` de quem já preencheu com `http://`; é o objetivo (ainda não há deploy). Os dois steps cobrem os dois sentidos. `CHANGE_ME_https://...` não é URL válida; isso não afeta o `docker compose config` (não valida formato) nem a T-40 (o teste dela usa env fake próprio).

- [ ] **T-42 CI sobe a API com config de produção.**
  - **Arquivos permitidos:** `.github/workflows/ci.yml`.
  - **Fazer:** no job `docker-api` (ou novo job), depois do build da imagem, rodar o container com o env válido gerado na T-41 e um Postgres de serviço, e checar `GET /healthz` = 200 em até 60 s. Objetivo: pegar falhas de `config.ts` como a E1 antes do deploy.
  - **Pronto quando:** reverter localmente a parte de `BILLING_WEBHOOK_SECRET` da T-40 faz esse job falhar (descreva isso no PR).

  #### Plano verificado (T-39)

  Evidência: E1 CONFIRMADA. Depende da T-40 (compose) e da T-41 (env válido gerado na CI).

  - **Arquivos que mudam:** só `.github/workflows/ci.yml`.
  - **Teste que falha primeiro:** o próprio job novo `smoke-api-prod`. Para provar o vermelho, rodar o job numa branch com o compose da `main` (antes da T-40): a API sai no boot com `Configuração inválida ... BILLING_WEBHOOK_SECRET` e o `/healthz` nunca responde. Colar o log no PR. Depois, com a T-40 aplicada, o job fica verde; reverter só a linha do `BILLING_WEBHOOK_SECRET` no compose faz o job voltar a falhar (descrever no PR, como pede a task).
  - **Passos:**
    1. Novo job `smoke-api-prod` (ou steps no `docker-api`): `docker/build-push-action@v6` com `load: true` e `tags: sigillus-api:ci` (hoje é `push: false` sem `load`, então a imagem não fica disponível para `docker run`).
    2. Gerar o env válido com o mesmo gerador do step da T-41 (valores fake em formato de produção, `NODE_ENV=production`, `BILLING_FAKE_ACKNOWLEDGED=true`, `MAIL_PROVIDER=log`).
    3. Para a CI exercitar o env **que o compose entrega** (e não um env montado à mão, que passaria mesmo com a E1), extrair o env do serviço `api` com `docker compose -f compose.prod.yaml --env-file <gerado> config --format json | jq` e passá-lo ao `docker run`, sobrescrevendo só `DATABASE_URL` para o Postgres de serviço (`--network host`, `localhost:5432`) e `S3_ENDPOINT` para um endpoint qualquer (o boot não fala com o S3).
    4. Poll de `curl -fsS http://127.0.0.1:4000/healthz` por até 60 s; em falha, `docker logs` e `exit 1`.
  - **Risco e cobertura:** o boot roda `MIGRATE_ON_BOOT=true` e `JOBS_ENABLED` padrão `true` (pg-boss cria schema no Postgres de serviço), o que é desejado; o `/healthz` não depende do S3. Se no implementar o boot tentar falar com o MinIO, adicionar MinIO de serviço em vez de afrouxar o check. Não afeta jobs existentes (job novo).

### Bloco B - funcionalidades que quebram só em produção

- [ ] **T-43 URLs pré-assinadas alcançáveis pelo navegador.**
  - **Arquivos permitidos:** `apps/api/src/config.ts`, `apps/api/src/lib/storage.ts`, testes de storage/mídia, `apps/api/.env.example`, `.env.prod.example`, `compose.prod.yaml`, `docs/deploy.md` (seções Caddy e env), `docs/adr/007-infra-escolhida.md` (emenda curta).
  - **Fazer:**
    - Nova env opcional `S3_PUBLIC_ENDPOINT` (URL). Quando definida, `storage.ts` usa **um segundo client S3** com esse endpoint **só para gerar URLs pré-assinadas** (upload e view); operações servidor→MinIO (`deleteObject`, `head`, processamento) continuam no client interno `S3_ENDPOINT`. Sem a env, comportamento atual (dev intacto).
    - Produção: `S3_PUBLIC_ENDPOINT=https://media.<dominio>` e `S3_PUBLIC_BASE_URL=https://media.<dominio>/<bucket>` (path-style).
    - Caddy de `deploy.md`: `media.<dominio>` faz `reverse_proxy 127.0.0.1:9000` **sem** `rewrite` (o Caddy preserva o `Host`, necessário para a assinatura).
  - **Teste que falha antes:** com `S3_PUBLIC_ENDPOINT=https://media.example.com` e `S3_ENDPOINT=http://minio:9000`, a URL de `createUpload` e a de view privada têm host `media.example.com`; `S3_PUBLIC_BASE_URL` continua gerando URL pública de `public/...`.
  - **Pronto quando:** teste passa e o fluxo E2E de upload continua verde em dev (sem a env).

  #### Plano verificado (T-39)

  Evidência: E6 CONFIRMADA (URL com host `minio`, `host` assinado).

  - **Arquivos que mudam:** `apps/api/src/config.ts` (env `S3_PUBLIC_ENDPOINT: optionalUrl`), `apps/api/src/lib/storage.ts`, `apps/api/tests/storage.test.ts` (novo), `apps/api/.env.example` (comentado), `.env.prod.example`, `compose.prod.yaml` (`S3_PUBLIC_ENDPOINT: ${S3_PUBLIC_ENDPOINT:?...}` no `api`), `docs/deploy.md` (Caddy e tabela), `docs/adr/007-infra-escolhida.md` (emenda curta).
  - **Teste que falha primeiro** (`apps/api/tests/storage.test.ts`, sem rede: `getSignedUrl` só assina, não chama o S3):
    1. Com `S3_ENDPOINT=http://minio:9000`, `S3_PUBLIC_ENDPOINT=https://media.example.com`, `S3_FORCE_PATH_STYLE=true`: `presignUpload(...).url` e `presignView(...)` têm `host === "media.example.com"`, `protocol === "https:"` e `pathname` começando com `/<bucket>/`. Na `main` falha (host `minio:9000`).
    2. Sem `S3_PUBLIC_ENDPOINT`: as URLs continuam com o host de `S3_ENDPOINT` (dev intacto).
    3. `publicUrl("public/x.jpg")` continua `${S3_PUBLIC_BASE_URL}/public/x.jpg`.
    4. `loadConfig` aceita `S3_PUBLIC_ENDPOINT` vazio (vira `undefined`) e rejeita valor que não é URL.
  - **Passos:**
    1. Teste vermelho na `main`; colar saída.
    2. `config.ts`: `S3_PUBLIC_ENDPOINT: optionalUrl`.
    3. `storage.ts`: extrair a construção do client para uma função local; criar `presignClient = config.S3_PUBLIC_ENDPOINT ? new S3Client({ ...mesmas opções, endpoint: config.S3_PUBLIC_ENDPOINT }) : client`; `presignUpload` e `presignView` usam `presignClient`; `head`, `getObject`, `putObject`, `deleteObject` continuam no `client`.
    4. Produção: `S3_PUBLIC_ENDPOINT=https://media.<dominio>` e `S3_PUBLIC_BASE_URL=https://media.<dominio>/<bucket>` em `.env.prod.example` e na tabela do `deploy.md`. Hoje os dois divergem: o template tem `S3_PUBLIC_BASE_URL=http://localhost:9000/sigillus-media` (com bucket, linha 22) e a tabela do `deploy.md` tem `https://media.seudominio.com` (sem bucket, contando com o `rewrite` do Caddy). Os dois passam a usar o formato com bucket.
    5. Caddy: `media.<dominio> { reverse_proxy 127.0.0.1:9000 }` sem `rewrite`.
    6. ADR-007: emenda de 2-3 linhas (endpoint público separado para assinatura; Caddy sem rewrite).
  - **Risco e cobertura:**
    - Trocar `S3_PUBLIC_BASE_URL` para incluir o bucket muda as URLs públicas já salvas? Não: a API monta a URL na hora a partir da `storageKey` (`publicUrl(key)`); nada persiste URL. Confirmar com `grep -rn "publicUrl(" apps/api/src` no PR.
    - O Caddy precisa repassar o `Host` original (`media.<dominio>`) para o MinIO; `reverse_proxy` do Caddy preserva o `Host` por padrão. O MinIO valida a assinatura com esse host. Não coberto por teste unitário; coberto pelo smoke manual (`docs/smoke.md`, upload de mídia) no primeiro deploy.
    - CORS do MinIO para `PUT` do navegador a partir de `app.<dominio>` não muda com esta task (em dev já funciona com outra origem). Validar no smoke.
    - Dev e E2E não definem a env; o item 2 cobre que o comportamento atual se mantém.

- [ ] **T-44 `next/image` aceita o host de mídia de produção.**
  - **Arquivos permitidos:** `apps/web/next.config.ts`, `apps/web/Dockerfile`, `compose.prod.yaml` (build args do web), `.env.prod.example`, `apps/web/.env.example`.
  - **Fazer:** novo build arg/env `NEXT_PUBLIC_MEDIA_URL`. `remotePatterns` passa a ser montado a partir dele (protocolo, host, porta). Hosts `localhost`/`127.0.0.1` só entram quando `NODE_ENV !== "production"`. Remover unsplash e pexels (não há mais referência a eles no código; confirme com `grep` e cole a saída no PR).
  - **Teste que falha antes:** teste unitário que importa a config com `NODE_ENV=production` e `NEXT_PUBLIC_MEDIA_URL=https://media.example.com` e verifica que esse host está em `remotePatterns` e `localhost` não está.
  - **Pronto quando:** teste passa; E2E verde.

  #### Plano verificado (T-39) — PARADO

  Evidência: E7 CONFIRMADA. O plano **para** em dois pontos que o texto da task não resolve:

  1. **Premissa falsa sobre unsplash.** A task diz que não há mais referência a unsplash/pexels no código. No `apps/web` não há (`grep` vazio fora do `next.config.ts`), mas as fixtures de seed da API têm 25 URLs `https://images.unsplash.com/...`: 19 em `ads.images` e 6 em `mediaHighlights.coverUrl` (`apps/api/src/db/seed/fixtures/dev-data.json`). Essas seeds rodam em dev e na E2E (`npm run test:e2e` roda `db:seed`). Telas que usam `next/image` sem `unoptimized` com essas URLs: `ad-details/photo-gallery-section.tsx`, `photo-lightbox.tsx`, `trending-media-screen.tsx`, `admin-profiles-screen.tsx` e outras. Remover unsplash quebra as imagens em dev/E2E (400 do otimizador). Opções: (a) manter unsplash só quando `NODE_ENV !== "production"`, junto com `localhost`; (b) trocar as fixtures por imagens locais/MinIO (`dev-data.json` está fora da lista). Pergunta registrada na seção 5 (P-14).
  2. **Não há runner de teste unitário no `apps/web`.** `apps/web/package.json` só tem Playwright; não existe `vitest` nem config. O "teste unitário que importa a config" exige um arquivo fora da lista: (a) `apps/web/package.json` + `package-lock.json` + `vitest.config.ts` + o teste (Vitest no web); (b) o teste em `apps/api/tests/` importando `../../web/next.config.ts` (o arquivo só importa `node:path` e um tipo, então roda no Vitest da API, mas fica no workspace errado); (c) um spec Playwright sem `page` em `apps/web/tests/` (o runner já existe, só o arquivo é novo). Precisa de autorização para um desses arquivos.

  O que já está verificado e vale para quando destravar:

  - **Arquivos que mudam:** `apps/web/next.config.ts` (exportar `buildRemotePatterns(env)` puro e usar em `images.remotePatterns`), `apps/web/Dockerfile` (`ARG`/`ENV NEXT_PUBLIC_MEDIA_URL` ao lado de `NEXT_PUBLIC_API_URL`, linhas 15-18), `compose.prod.yaml` (`args.NEXT_PUBLIC_MEDIA_URL: ${NEXT_PUBLIC_MEDIA_URL:?...}`), `.env.prod.example`, `apps/web/.env.example`, mais o arquivo de teste autorizado.
  - **Teste que falha primeiro:** `buildRemotePatterns({ NODE_ENV: "production", NEXT_PUBLIC_MEDIA_URL: "https://media.example.com/sigillus-media" })` contém `{ protocol: "https", hostname: "media.example.com", port: "" }` e nenhum `localhost`/`127.0.0.1`. Na `main` falha (a função não existe e o host não está na lista).
  - **Passos:** teste vermelho → função pura → `next.config.ts` usa `buildRemotePatterns(process.env)` → build arg no Dockerfile e compose → env examples → E2E.
  - **Risco e cobertura:** `remotePatterns` é avaliado no `next build` (por isso precisa ser build arg, não env de runtime). O otimizador do Next 16 recusa buscar IP privado (`image-optimizer.js:895-896`, `dangerouslyAllowLocalIP`); em produção `media.<dominio>` resolve para o IP público da VPS, então funciona, mas depende de hairpin NAT do provedor. Validar no smoke. As URLs de view privadas (presign) têm query string; com `search` omitido o pattern aceita qualquer query.

- [ ] **T-45 Exclusão de conta segura e atômica (LGPD).**
  - **Arquivos permitidos:** `packages/contracts/src/router.ts` (input de `deleteAccount`), `apps/api/src/modules/auth/router.ts`, `apps/api/src/lib/auth.ts` (só `user.deleteUser`), `apps/api/tests/auth.test.ts`, `apps/web/components/screens/account-screen.tsx`, spec E2E de conta.
  - **Fazer:**
    - Contrato: `deleteAccount` passa a exigir `{ password: z.string().min(1) }` (troca o `confirmation` opcional). Re-autenticação por senha também protege contra sessão sequestrada.
    - Ordem no handler: (1) ler as `storageKey`/`thumbnailKey` do usuário; (2) chamar `auth.api.deleteUser({ body: { password }, headers })`; (3) a anonimização de mensagens e o `lastMessagePreview` saem do handler e vão para `user.deleteUser.beforeDelete` em `lib/auth.ts`, que roda **depois** da checagem de senha (ver E8); (4) só depois de `deleteUser` retornar com sucesso, apagar os objetos do storage (best-effort, falha só gera log com o id do asset). O `delete` manual de `media_asset` sai (já há `onDelete: cascade`).
    - Mapear erros do better-auth para PT-BR na UI: senha inválida, credencial não encontrada.
    - Web: o modal de confirmação pede a senha.
    - **Não mudar** o comportamento quando quem apaga é profissional (conversas caem por cascade via perfil). Isso é decisão pendente P-10.
  - **Testes que falham antes:**
    - senha errada → erro, usuário existe, mídias continuam no storage, mensagens intactas;
    - sessão com `createdAt` recuado 2 dias + senha certa → conta excluída, mensagens do usuário anonimizadas, objetos removidos do storage;
    - sem senha → erro de validação do contrato.
  - **Pronto quando:** os três testes passam e o E2E de exclusão usa senha.

  #### Plano verificado (T-39)

  Evidência: E8 CONFIRMADA. FKs conferidas: `media_asset.ownerUserId` tem `onDelete: "cascade"` (`db/schema/media.ts:9-11`); `message.senderUserId` e `conversation.clientUserId/professionalUserId` **não** têm FK para `user` (`db/schema/chat.ts:22-23,65`), então mensagens sobrevivem à exclusão e precisam ser anonimizadas explicitamente.

  - **Arquivos que mudam:** `packages/contracts/src/router.ts` (linha 84), `apps/api/src/modules/auth/router.ts`, `apps/api/src/lib/auth.ts` (só o bloco `user.deleteUser`, linhas 65-67), `apps/api/tests/auth.test.ts`, `apps/web/components/screens/account-screen.tsx` (chamada na linha 177 e modal nas linhas ~745-785), e um spec E2E novo `apps/web/tests/account-deletion.spec.ts` (não existe spec de conta hoje; a lista permite "spec E2E de conta").
  - **Testes que falham primeiro** (`apps/api/tests/auth.test.ts`):
    1. "senha errada não apaga nada": `deleteAccount({ password: "errada" })` → 400 com mensagem em PT-BR; usuário existe; objeto continua em `harness.storage.objects`; `media_asset` existe; mensagem com conteúdo original; `lastMessagePreview` original. Na `main` falha: o Zod do contrato atual descarta a chave desconhecida `password`, o handler apaga mídia e mensagens e, com sessão recém-criada, `deleteUser({ body: {} })` exclui a conta sem checar senha nenhuma.
    2. "sessão velha + senha certa exclui": recuar `session.createdAt` em 2 dias via `harness.db.update(schema.sessions)`; `deleteAccount({ password: "Senha@12345" })` → 200; `auth.me` → `null`; mensagens anonimizadas; `lastMessagePreview` = `[Mensagem apagada]`; objeto removido do storage. Na `main` falha com `SESSION_EXPIRED` (E8).
    3. "sem senha é erro de validação": `deleteAccount({})` → 400 do contrato. Na `main` falha (hoje retorna 200).
    4. O teste existente `auth.deleteAccount apaga mídias...` (linha 113) passa a enviar a senha; as asserções dele ficam iguais.
  - **Passos:**
    1. Testes vermelhos; colar saída.
    2. Contrato: `.input(z.object({ password: z.string().min(1) }))` (sem `.default({})`).
    3. `lib/auth.ts`: `user.deleteUser.beforeDelete: async (user) => { anonimiza message onde senderUserId = user.id; lastMessagePreview = "[Mensagem apagada]" nas conversas do usuário }`, usando o `db` que `createUserAuth` já recebe. Mesmo texto e mesmos campos de hoje (`content`, `mediaAssetId: null`, `brief: null`, `editedAt`).
    4. `modules/auth/router.ts`: (1) ler `storageKey`/`thumbnailKey` do usuário; (2) `await auth.api.deleteUser({ body: { password: input.password }, headers })`; (3) só depois, laço best-effort de `storage.deleteObject` com `logger.warn({ err, assetId })` em falha; remover o `delete(mediaAssets)` manual e as anonimizações do handler. Capturar `APIError` do better-auth e relançar como `ORPCError("BAD_REQUEST")` com mensagem PT-BR para `INVALID_PASSWORD` ("Senha incorreta.") e `CREDENTIAL_ACCOUNT_NOT_FOUND` ("Esta conta não tem senha cadastrada."). Não logar o corpo da requisição (contém senha).
    5. Web: o modal ganha um campo de senha (`type="password"`, `autoComplete="current-password"`), botão desabilitado com campo vazio, envia `client.auth.deleteAccount({ password })` e mostra a mensagem do erro.
    6. E2E `account-deletion.spec.ts`: cria um cliente descartável via API (não usar o cliente das seeds, que outros specs usam), abre `/conta`, senha errada mostra erro e a conta continua; senha certa sai para a home e o login falha depois.
  - **Risco e cobertura:**
    - `beforeDelete` roda antes de `internalAdapter.deleteUser`, fora de transação com o nosso `db`. Se o delete falhar depois do hook, as mensagens ficam anonimizadas com a conta viva. É bem mais estreito que hoje (já passou senha e freshness) e não perde mídia. Não coberto por teste; registrar no PR.
    - Profissional: o comportamento atual por cascade via perfil não muda (P-10). O teste 2 usa cliente; adicionar um caso de profissional só verificando que a exclusão funciona, sem asserção sobre conversas.
    - Falha no storage depois do delete gera objeto órfão (só log). Aceito pela própria task.
    - Mudar o input quebra qualquer outro chamador de `auth.deleteAccount`: `grep` mostra só `account-screen.tsx:177`. O `npm run typecheck` cobre.

### Bloco C - qualidade e dívida que afeta manutenção

- [ ] **T-46 Desfazer o afrouxamento de testes do #62.**
  - **Arquivos permitidos:** `apps/web/tests/encounter-brief.spec.ts`, `apps/web/tests/stress-resilience.spec.ts` e o código de produto que causar a falha.
  - **Fazer:** remover `force: true` e descobrir o que cobre o card (rodar com trace: `npx playwright test encounter-brief --trace on`); corrigir a causa no produto (overlay, modal, animação). Restaurar o duplo envio paralelo (`Promise.all([sendBtn.click(), sendBtn.click()])` ou dispatch de dois `click` no mesmo tick) e garantir no produto que só um card é enviado (botão desabilitado durante o envio e/ou dedupe por `clientMessageId`).
  - **Pronto quando:** os dois specs passam 10 vezes seguidas (`--repeat-each=10`) sem `force` e com o envio paralelo. Cole o resumo no PR.

  #### Plano verificado (T-39)

  Evidência: E9 CONFIRMADA, e mais forte do que o texto diz: no run `38091174075` (já com `force: true`) o `encounter-brief.spec.ts:101` falhou na 1ª tentativa com `locator.click: Element is not visible` e só passou no retry. O `force` não corrigiu nada; o retry da CI esconde.

  - **Arquivos que mudam:** `apps/web/tests/encounter-brief.spec.ts` (linha 115), `apps/web/tests/stress-resilience.spec.ts` (linha 44) e o código de produto que a investigação apontar. Candidatos lidos: o card do feed é `<a ... class="group relative ... perspective-[1000px] ... z-0">` dentro de `[data-feed-premium-section]` (do log da CI); o botão de envio é `components/ui/encounter-brief-card.tsx:200-208` (`disabled={!canSend}`, `canSend = greeting.trim().length > 0 && !sending`).
  - **Teste que falha primeiro:** os próprios specs restaurados. `encounter-brief.spec.ts` com `adCard.click()` sem `force`; `stress-resilience.spec.ts` com dois cliques no mesmo tick. Rodar `npx playwright test tests/encounter-brief.spec.ts tests/stress-resilience.spec.ts --repeat-each=10 --retries=0 --trace retain-on-failure` (dentro de `apps/web`, com API e banco de pé) e colar o resumo de falhas no PR. `--retries=0` é essencial: com retry a falha some.
  - **Passos:**
    1. Reverter as duas linhas do #62 e rodar o comando acima até reproduzir; abrir o trace da falha e identificar o estado do card no clique (animação de entrada com `opacity`/`transform`, card fora da viewport dentro de container com overflow, ou re-render que troca o nó).
    2. Corrigir a causa no produto (ex.: não deixar o link com área zero/invisível durante a animação do feed; manter o nó estável entre renders). Sem `waitForTimeout`, sem `force`.
    3. Envio duplo: usar `sendBtn.evaluate((el) => { (el as HTMLButtonElement).click(); (el as HTMLButtonElement).click(); })`. Motivo: `Promise.allSettled([sendBtn.click(), sendBtn.click()])` tolera que o 2º clique nunca aconteça (o nome do botão vira "Enviando..." e o locator por nome deixa de casar), então ele não prova nada; dois `click()` síncronos no mesmo tick disparam antes do re-render do React, que é exatamente a corrida a testar.
    4. Se o teste mostrar 2 cards, proteger no produto: `ref` de envio em andamento no handler `onSend` (o `disabled` do React só vale após o re-render) e/ou dedupe por `clientMessageId` no `chat-store`.
    5. Rodar `--repeat-each=10 --retries=0` até 0 falhas; colar o resumo.
  - **Risco e cobertura:** mexer na animação do feed pode afetar `feed.spec.ts` (rajadas de scroll) e a skill `refine-motion` passa a valer (AGENTS.md). Rodar `feed.spec.ts` e `home.spec.ts` junto. A suíte E2E completa antes do PR cobre o resto.

- [ ] **T-47 Remover o resto do dual-mode.**
  - **Arquivos permitidos:** `apps/web/lib/data-source.ts` e os arquivos que importam `isApiDataSource` (hoje: `premium-plan.ts`, `chat-service.ts`, `review-invites.ts`, `account-notifications.ts`, `premium-catalog.ts`, `catalogs-data.ts`, `professional-dashboard/announcement-tab.tsx`).
  - **Fazer:** apagar `isApiDataSource()`; em cada chamada, manter só o ramo `api` e apagar o ramo mock. Apagar `localStorage` **apenas** quando ele estava dentro de um ramo mock. Uso de `localStorage` que não depende de `isApiDataSource` (preferência de UI, age gate) fica. Listar no PR cada chave de `localStorage` removida e cada uma mantida, com o motivo.
  - **Pronto quando:** `grep -rn "isApiDataSource" apps/web` vazio; `data-source.ts` só exporta `getApiUrl`; E2E verde.

  #### Plano verificado (T-39)

  Sem evidência E associada; a dívida foi confirmada: `apps/web/lib/data-source.ts` tem `isApiDataSource() { return true; }` e `grep` encontra 40 usos em 7 arquivos (`chat-service.ts` 12, `premium-plan.ts` 8, `review-invites.ts` 8, `premium-catalog.ts` 4, `account-notifications.ts` 3, `announcement-tab.tsx` 3, `catalogs-data.ts` 2), exatamente a lista da task.

  - **Arquivos que mudam:** os 8 da lista (`data-source.ts` + 7). Nenhum outro.
  - **Teste que falha primeiro:** não há comportamento a mudar (o ramo `api` já é o único executado), então não existe teste vermelho de produto. O "vermelho" é o critério da task: `grep -rn "isApiDataSource" apps/web --include=*.ts --include=*.tsx` hoje retorna 41 linhas (40 usos + a definição); colar no PR antes e depois (vazio). Rede de segurança: E2E completa verde antes e depois.
  - **Passos:**
    1. Por arquivo, apagar o `if (!isApiDataSource())`/ramo mock e manter o ramo `api`; remover o import.
    2. `localStorage` encontrado (a classificar no PR, linha a linha): `review-invites.ts` `sigillus-review-invites` (13, 73, 109); `premium-plan.ts` `sigillus-premium-plan` (17, 45, 103, 120) e `VIEW_ONCE_COUNT_KEY` (54, 143); `account-notifications.ts` chaves por papel de banner, ack da navbar e swing pausado (60, 81, 84, 113-115). Regra: só sai o que estava **dentro** de ramo mock. As de `account-notifications.ts` parecem preferência de UI (ficam) e as de `premium-plan.ts`/`review-invites.ts` parecem estado mock (saem), mas isso só se decide lendo o ramo de cada uma.
    3. `data-source.ts` fica só com `DEFAULT_API_URL` e `getApiUrl`. A task diz "só exporta `getApiUrl`": verificar se `DEFAULT_API_URL` é importado em outro lugar antes de deixá-lo não exportado.
    4. `npm run check` + E2E completa.
  - **Risco e cobertura:** apagar por engano uma chave de preferência de UI muda comportamento (banner reaparece, etc.). A lista no PR e os specs de `navigation`, `premium-conversion-modal-scroll-gate` e `review-invite` cobrem os fluxos afetados. Usuários com chaves antigas no navegador ficam com lixo inofensivo no `localStorage`.

- [ ] **T-48 Backup cobre mídia e tem restauração documentada.**
  - **Arquivos permitidos:** `scripts/backup.sh` (novo, versionado), `docs/deploy.md` (seção 7).
  - **Fazer:** mover o script do `deploy.md` para `scripts/backup.sh`; usar `POSTGRES_USER`/`POSTGRES_DB` do env em vez de `sigillus` fixo; adicionar cópia do bucket com `mc mirror` (via container `minio-init`/`mc` na rede do compose) para um diretório local de backup com a mesma retenção; documentar o passo a passo de **restauração** (Postgres e mídia). Destino externo fica de fora (P-11): deixar só um ponto de extensão comentado.
  - **Pronto quando:** `bash -n scripts/backup.sh` ok e o PR descreve uma execução real contra o compose local com o resultado de um restore do dump num banco vazio.

  #### Plano verificado (T-39)

  Sem evidência E associada; o problema foi confirmado em `docs/deploy.md` seção 7: o script só faz `pg_dump -U sigillus sigillus` (usuário e banco fixos), não copia o bucket e não há procedimento de restauração.

  - **Arquivos que mudam:** `scripts/backup.sh` (novo) e `docs/deploy.md` seção 7.
  - **Teste que falha primeiro:** `bash -n scripts/backup.sh` falha hoje porque o arquivo não existe; o teste real é a execução descrita no "Pronto quando": rodar o script contra o compose local, restaurar o dump num banco vazio e comparar `select count(*)` de `user`, `professional_profile` e `message`; espelhar o bucket e comparar a contagem de objetos (`mc ls --recursive | wc -l`) com a origem.
  - **Passos:**
    1. `scripts/backup.sh` com `set -euo pipefail`, parâmetros `COMPOSE_FILE`, `ENV_FILE`, `BACKUP_DIR`, `RETENTION_DAYS` (padrão 14); lê `POSTGRES_USER`/`POSTGRES_DB`/`S3_BUCKET` do env file.
    2. Postgres: `docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip`.
    3. Mídia: `docker compose ... run --rm -v "$BACKUP_DIR/media_$DATE:/backup" --entrypoint /bin/sh minio-init -c 'mc alias set ... && mc mirror local/$S3_BUCKET /backup'` (a imagem `chainguard/minio` já tem `/bin/mc`, usado no healthcheck).
    4. Retenção para `*.sql.gz` e diretórios `media_*`; ponto de extensão comentado para destino externo (P-11).
    5. `deploy.md` seção 7: chamar `scripts/backup.sh` no cron e adicionar "Restauração" (Postgres: `gunzip -c | docker compose exec -T postgres psql`; mídia: `mc mirror /backup local/$S3_BUCKET`).
  - **Risco e cobertura:** o `docker compose run` do `minio-init` herda o `entrypoint` atual (cria bucket e sai); sobrescrever com `--entrypoint` evita isso. Depende da T-40 se o digest da imagem mudar (só o nome do serviço importa aqui). Restauração em produção não é testada por CI; a execução local descrita no PR é a cobertura.

- [ ] **T-49 Documentação consistente.**
  - **Arquivos permitidos:** `docs/adr/006-deploy.md`, `docs/adr/007-infra-escolhida.md`, `docs/adr/016-virada-api-e-remocao-dos-mocks.md`, `docs/roteiro.md`, `docs/deploy.md`.
  - **Fazer:** ADR-007: caminho correto `node dist/create-admin.js`; emendas das T-40/T-43. ADR-006: nota no topo "Parcialmente substituída pela ADR-007" e corrigir a frase de que o fake "nunca" vai para produção (hoje sobe com `BILLING_FAKE_ACKNOWLEDGED=true`, por decisão D-01). ADR-016: corrigir "remoção completa" para refletir a T-47. Roteiro: adicionar na seção 5 a linha "Correções pré-deploy em `docs/correcoes-pre-deploy.md` (Fase 2.1), obrigatórias antes do deploy".
  - **Pronto quando:** `grep -rn "dist/cli/create-admin" docs` vazio e as frases acima corrigidas.

  #### Plano verificado (T-39)

  Confirmado por `grep`: `docs/adr/007-infra-escolhida.md:59` usa `node dist/cli/create-admin.js` enquanto `docs/deploy.md:135` usa `node dist/create-admin.js` (o build gera `dist/create-admin.js`, `apps/api/tsup.config.ts` alterado no #62). `docs/adr/006-deploy.md:35` diz que `fake` "**nunca** deve ser o valor em produção (a API recusa subir com `NODE_ENV=production` e `BILLING_PROVIDER=fake`)", mas `config.ts:61-71` só recusa sem `BILLING_FAKE_ACKNOWLEDGED=true` e o compose usa `:-true`. A ADR-016 não tem a frase literal "remoção completa"; as frases a corrigir são a linha 9 ("100% das áreas ... implementações completas") e a lista da linha 18, que não mencionam o dual-mode remanescente.

  - **Arquivos que mudam:** `docs/adr/006-deploy.md`, `docs/adr/007-infra-escolhida.md`, `docs/adr/016-virada-api-e-remocao-dos-mocks.md`, `docs/deploy.md`. O `docs/roteiro.md` **já recebe a linha** "Correções pré-deploy em `docs/correcoes-pre-deploy.md` (Fase 2.1), obrigatórias antes do deploy" no PR da T-39; na T-49 só conferir.
  - **Teste que falha primeiro:** `grep -rn "dist/cli/create-admin" docs` retorna `docs/adr/007-infra-escolhida.md:59` hoje; deve ficar vazio.
  - **Passos:** corrigir ADR-007 linha 59 e acrescentar as emendas da T-40 (portas em loopback, imagem pinada, envs novas) e da T-43 (`S3_PUBLIC_ENDPOINT`, Caddy sem rewrite); nota no topo da ADR-006 "Parcialmente substituída pela ADR-007" e reescrever a linha 35 conforme D-01; ADR-016 com uma linha dizendo que o dual-mode residual foi removido na T-47; `deploy.md` alinhado com o que as T-40/T-43/T-48 já mudaram. Os comandos sem `--env-file` (seção 7) não entram aqui sem o Daniel incluir.
  - **Risco e cobertura:** só documentação. Fazer por último porque depende do texto final das T-40, T-43, T-47 e T-48.

---

## 5. Decisões pendentes (perguntar ao Daniel, não executar)

| #    | Pergunta                                                                                                                                                                                                                                                                                                                       | Bloqueia                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| P-10 | Quando um **profissional** exclui a conta, as conversas somem por cascade (via perfil) e o cliente perde o histórico; quando um **cliente** exclui, as conversas ficam com as mensagens anonimizadas. Manter essa assimetria ou igualar?                                                                                       | Nenhuma task desta fase          |
| P-11 | Para onde vai o backup externo (outro provedor, bucket S3, máquina em casa)?                                                                                                                                                                                                                                                   | Extensão da T-48                 |
| P-12 | Texto jurídico (Termos/Privacidade), identificação do controlador e contato do encarregado.                                                                                                                                                                                                                                    | Lançamento público, não as tasks |
| P-13 | O repositório deve continuar público?                                                                                                                                                                                                                                                                                          | Nada técnico                     |
| P-14 | As seeds de dev/E2E usam 25 imagens de `images.unsplash.com` (`ads.images` e `mediaHighlights.coverUrl` em `apps/api/src/db/seed/fixtures/dev-data.json`). Na T-44: (a) manter unsplash em `remotePatterns` só fora de produção, ou (b) trocar as imagens das seeds por arquivos locais/MinIO (arquivo fora da lista da T-44)? | T-44                             |

---

## 6. Dívida técnica registrada (não fazer nesta fase)

- MinIO rodando como root (`user: "0:0"`); avaliar rodar como usuário não-root com permissão de volume ajustada.
- Build das imagens na própria VPS durante o deploy (`up --build`) compete com o tráfego; avaliar build na CI e `pull` no servidor.
- `proxy.ts` do web valida sessão chamando a API pela URL pública (`NEXT_PUBLIC_API_URL`), saindo e voltando pela internet; avaliar uma URL interna (`http://api:4000`) para chamadas servidor→servidor.
- `MemoryRateLimiter` vale só com uma instância da API (ADR-005).
- ADRs 008 a 016 são registro de tarefa, não de decisão; consolidar no futuro.
- Testes de "estresse" da T-28 são de concorrência leve; carga real (k6 ou similar) fica para depois do ar.

---

## 7. Achados novos (preenchido pelo agente durante a execução)

| Data  | Task em execução   | Arquivo / evidência                                                                                                                                                                                                                                                                                                                                      | Impacto                                                                                                                                                                                                                                                                                              | Sugestão                                                                                            |
| ----- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 10/10 | T-39 (verificação) | `docs/deploy.md` seções 5.2, 5.3 e 6 rodam `docker compose -f compose.prod.yaml ps`/`logs api`/`exec api` **sem** `--env-file .env.prod`. Reproduzido numa cópia isolada do compose: `error while interpolating services.api.environment.AUTH_SECRET: required variable AUTH_SECRET is missing a value`. Só o `up` (5.1) e o backup passam `--env-file`. | Seguindo o guia, a verificação pós-subida e a criação do primeiro admin falham.                                                                                                                                                                                                                      | Incluir `--env-file .env.prod` em todos os comandos do guia (T-49 ou T-40, a critério do Daniel).   |
| 10/10 | T-39 (verificação) | CI run `38086131619` (push de `2bc41f8`): `review-invite.spec.ts:42` falhou após retries (`getByRole('button', { name: 'Convidar para avaliar' })` não encontrado depois de "Retirar") e `review-invite.spec.ts:25` ficou flaky. Nenhuma task cobre esse spec; o #62 não mexeu nele e o run seguinte passou.                                             | Instabilidade E2E fora da T-46; a CI verde depende de retry.                                                                                                                                                                                                                                         | Avaliar junto com a T-46 rodando `review-invite.spec.ts --repeat-each=10 --retries=0`.              |
| 10/10 | T-39 (verificação) | `.claude/settings.json` tem `Read(.env*)` e `Edit(.env*)` em `deny`. O harness negou `cat .env.prod.example` e `cp .env.prod.example ...` mesmo com autorização do Daniel no chat.                                                                                                                                                                       | Bloqueava a E2 e a parte de `.env.prod.example` das T-40, T-41, T-43 e T-44. **Resolvido localmente em 10/10**: o Daniel removeu o bloco `deny` inteiro do `settings.json` (não commitado; fora deste PR). Com isso também saíram `Bash(npm run share)`, `Edit(.next/**)` e `Edit(node_modules/**)`. | Restaurar o `deny` sem as regras de `.env*` (ou com regras só para os `.env` reais), em PR próprio. |
| 10/10 | T-39 (verificação) | `media_highlight.coverUrl` (`apps/api/src/db/schema/profiles.ts:169`) só é preenchido pela seed de dev (`db/seed/dev-data.ts:136-140`), que não roda em produção (`db/seed/index.ts`: `devData ?? !config.isProduction`). Não há endpoint de admin que escreva nessa tabela.                                                                             | Em produção a tela de mídias em alta (`ads.mediaHighlights`) nasce vazia e não há como preenchê-la.                                                                                                                                                                                                  | Decisão de produto para depois do deploy (não bloqueia).                                            |

## Histórico deste arquivo

- 10/10/2026: criado a partir da análise da `main` em `462e015` (Claude, chat). Aguarda verificação na máquina do Daniel antes da execução.
- 10/10/2026: T-39 verificou E1-E9 (seção 2.1), escreveu os planos verificados das T-40 a T-49 (T-44 parada), adicionou P-14 na seção 5 e 4 achados na seção 7 (Claude Code).
