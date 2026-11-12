# Roteiro de lançamento — Sigillus (raparigator)

Fonte de verdade do **que falta fazer** para o app ir ao ar. Complementa o `AGENTS.md` (como trabalhar) e as ADRs (por que a stack é assim). Vale para quem estiver executando: Daniel, Claude Code ou Gemini.

Estado em **12/11/2026**: `v0.2.0` publicada (17/10/2026) e Fase F (faxina) em andamento.

## 0. Como usar este arquivo

1. Antes de qualquer task, leia este arquivo e o `AGENTS.md`. Não leia só a task: leia a fase inteira em que ela está.
2. Pegue a **primeira task `[ ]` da fase atual**, a menos que o Daniel aponte outra. Não pule fase.
3. **Uma task = um PR** de uma branch `feat/T-xx-nome-curto` para a `main`. Nada direto na `main`.
4. Ao concluir: marque `[x]`, anote `(PR #nn, dd/mm)` ao lado e, se aprendeu algo que muda uma task seguinte, edite a task seguinte. Nunca deixe descoberta solta em comentário ou chat: ou vira task, ou vira ajuste de task.
5. Se a task pedir uma decisão que não está na seção 2 nem na seção 7, **pare e pergunte** ao Daniel. Não decida regra de produto sozinho.
6. Critério de pronto de toda task: a seção "Critério de pronto" do `AGENTS.md`.

## 1. Estado atual

- Monorepo npm: `apps/web` (Next 16), `apps/api` (Hono + oRPC + Drizzle + better-auth + pg-boss), `packages/contracts` (contrato oRPC + Zod, fonte dos tipos), `packages/domain` (regras puras).
- API com 16 módulos e 85 procedimentos no contrato (`packages/contracts/src/router.ts`), todos com teste de integração; docs em `/api/docs` com a API rodando.
- O web fala só com a API (ADR-016); não há mock. A E2E roda contra API, Postgres e MinIO reais, na CI e localmente.
- Auth com duas instâncias do better-auth, usuário e admin (ADR-019). Moderação de anúncio pelo admin (`draft → pending_review → published`), verificação de identidade da anunciante, denúncias com provas, log de acesso e exclusão de conta (Fase J).
- Lançamento gratuito: Premium concedido pelo admin, checkout escondido por flag (ADR-018).
- Deploy preparado para VPS única com Docker Compose (ADR-007; operação em `docs/operacao/deploy.md` e `docs/operacao/smoke.md`).
- Ainda stub: `FakeBillingProvider` (único provedor de pagamento), envio de código de verificação de telefone (sem provedor de SMS) e `media.moderate` (marca `ready` sem checar nada).

## Fase atual: Fase F (faxina)

Limpeza do código antes de seguir com features: código morto, regras duplicadas, nomes, documentação e guardas de arquitetura. O inventário com os achados e as decisões D-01 a D-49 está em `docs/faxina-inventario.md`; os 22 PRs estão divididos em duas trilhas que rodam em paralelo, com ordem e conflitos em `docs/faxina-trilha-a.md` e `docs/faxina-trilha-b.md`.

As fases anteriores estão concluídas: Fase 0 e Fase 1 (integração web → API), Fase 2 e Fase 2.1 (pronto para o ar, `docs/correcoes-pre-deploy.md`) e Fase J (jurídica e privacidade, `docs/correcoes-juridico.md`, exceto a T-69, que aguarda a lista do operador).

## 2. Decisões tomadas (04/10/2026)

| #    | Decisão                                                                                              | Consequência prática                                                                                                                                                                    |
| ---- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01 | **Lançamento inicial gratuito.** Sem PSP, sem cobrança.                                              | Nenhuma integração de pagamento antes do ar. O módulo `premium` fica no código, o checkout fica escondido na UI (T-22).                                                                 |
| D-02 | **Preços guardados** para quando começar a cobrar: R$ 10 mensal, R$ 30 semestral (50% off).          | Ficam em `packages/domain/src/premium.ts` (`PREMIUM_PLAN_OPTIONS`). **Não remover nem alterar** sem o Daniel pedir.                                                                     |
| D-03 | **Entrada livre.** Cadastro sem verificação obrigatória de e-mail ou telefone.                       | Verificação vira opcional por flag (T-21). O gate de qualidade é a aprovação manual do admin, que já existe.                                                                            |
| D-04 | **Daniel gerencia perfis ativos pelo dashboard admin.**                                              | Fluxo `pending_review → published` da API é mantido como está. O backoffice (passo 10) sobe de prioridade dentro da fase 2: sem ele integrado, não há como aprovar ninguém em produção. |
| D-05 | **Daniel toca o projeto sozinho.** Marco não revisa PRs.                                             | O revisor é a CI. Todo PR precisa de `check`, `test` e E2E verdes. Nenhum merge com CI vermelha, nem "arrumo depois".                                                                   |
| D-06 | **`main` é a única branch de longa duração.** `development` foi apagada.                             | Referências a `development` em README, AGENTS e CI são bug (T-02).                                                                                                                      |
| D-07 | Regras de agente ficam **commitadas** no repo (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, este roteiro). | Nada de `CLAUDE.local.md` ou `GEMINI.md` fora do git: foi assim que o projeto perdeu o fio.                                                                                             |
| D-08 | Restrição de produto continua: **vitrine de anúncios**, sem intermediação de serviço.                | Ver `docs/adr/README.md`. Vale para toda task deste roteiro.                                                                                                                            |

## 3. Fase 0 — higiene (concluída em 04/10/2026)

T-01 a T-04: alterações locais commitadas, `development` trocada por `main`, permissões do Claude Code e agentes apontando para este roteiro.

## 4. Fase 1 — integração web → API (concluída em 10/10/2026)

O web saiu dos mocks para a API, um módulo por PR, e a E2E passou a rodar contra a API. Decisões que continuam valendo no ADR-016; textos da época em `docs/historico/`.

- [x] T-10 Catálogos e anúncio público (PR #42, 08/10)
- [x] T-11 Auth e sessão (PR #43, 08/10)
- [x] T-12 Rascunho de anúncio (PR #44, 08/10)
- [x] T-13 Mídia (PR #45, 08/10)
- [x] T-14 Chat (PR #47, 09/10)
- [x] T-15 Avaliações e convites (PR #48, 09/10)
- [x] T-16 Notificações (PR #49, 09/10)
- [x] T-17 Premium (PR #50, 09/10)
- [x] T-18 Backoffice (PR #51, 09/10)
- [x] T-19 Remoção dos mocks e E2E contra a API (PR #52, 10/10)

## 5. Fase 2 — pronto para o ar (versão gratuita)

Pode intercalar com o fim da fase 1; T-20 e T-21 não dependem de nada.

Correções pré-deploy em `docs/correcoes-pre-deploy.md` (Fase 2.1), obrigatórias antes do deploy. Evidências verificadas e planos por task registrados na T-39.

Correções jurídicas e de privacidade em `docs/correcoes-juridico.md` (Fase J, depois da `v0.1.0`), na ordem do arquivo. Verificação e planos por task registrados na T-59.

- [x] **T-20 CLI `create-admin`.** `apps/api/src/cli/create-admin.ts` + script `admin:create -w apps/api`, lendo e-mail, nome e senha de argumentos ou env, reaproveitando `upsertAdminWithPassword` de `src/db/seed/users.ts`. Hoje não existe forma de criar o primeiro admin em produção (sign-up de admin é desligado e as seeds de admin não rodam com `NODE_ENV=production`). Testar que roda contra o banco de teste. (PR #53, 10/10)

- [x] **T-21 Verificação opcional por flag** (D-03). API: env `VERIFICATION_REQUIRED` (default `false`), exposto em `verification.getState` como `required: boolean` (adicionar ao schema em `contracts`). Nenhum endpoint passa a exigir verificação; a flag só informa a UI. Web: `account-screen.tsx` e `professional-dashboard-screen.tsx` mostram a seção de verificação como "opcional" quando `required=false` e escondem o botão de enviar código enquanto não houver provedor (sem provedor, `sendCode` só loga; não prometer ao usuário um código que não chega). Pronto quando: cadastro e publicação funcionam sem verificar nada, e a UI não oferece envio de código. (PR #54, 10/10)

- [x] **T-22 Premium em modo gratuito** (D-01). API: env `PREMIUM_CHECKOUT_ENABLED` (default `false`); `premium.startSubscription` responde `CONFLICT` com mensagem clara quando desligado; `premium.getState` passa a incluir `checkoutEnabled: boolean`. Web: com `checkoutEnabled=false`, esconder `premium-entry-banner`, `premium-entry-button`, a rota `/profissional/assinatura-premium` redireciona para o dashboard e o `premium-conversion-modal` não abre. Decisão pendente P-01 resolvida com opção (b): admin concede premium à mão via `admin.grantPremium`. Concluído com testes unitários, integração e E2E. (PR #55, 10/10)

- [x] **T-23 E-mail transacional mínimo.** Depende de P-02 (Resend escolhido). Implementado `Mailer` com `LogMailer` (dev/testes) e `ResendMailer` (produção), suporte a `MAIL_PROVIDER` no config e `.env.example`, redefinição de senha conectada no better-auth com envio por e-mail, telas `/auth/esqueci-senha` e `/auth/redefinir-senha` no web com link no login, e `Mailer` conectado ao canal de e-mail do `verification`. Concluído com testes unitários, integração e E2E. (PR #56, 10/10)

- [x] **T-24 Termos, Privacidade e exclusão de conta (LGPD).** Páginas estáticas `app/(public)/termos/page.tsx` e `app/(public)/privacidade/page.tsx` com link no rodapé e checkbox obrigatório no cadastro (texto com rascunho completo alinhado em P-05). API: `auth.deleteAccount` no contrato, usando `deleteUser` do better-auth; anonimizar mensagens enviadas (`senderId` preservado, conteúdo substituído) e apagar mídia do storage. Web: botão em `account-screen.tsx` com confirmação. (PR #57, 10/10)

- [x] **T-25 Dockerfile do web e compose de produção.** `apps/web/Dockerfile` multi-stage usando `output: "standalone"` (já configurado) com `NEXT_PUBLIC_*` como build args. `compose.prod.yaml` na raiz com `api`, `web`, `postgres`, `minio`, volumes e healthchecks; `compose.yaml` continua só para dev. Adicionado job `docker-web` na CI ao lado do `docker-api`. (PR #58, 10/10)

- [x] **T-26 Deploy.** Depende de P-03 e P-04 (ambas resolvidas). Checklist de env de produção da API e do Web estruturado em `.env.prod.example` e documentado em `docs/operacao/deploy.md`; ADR-007 registrado em `docs/adr/007-infra-escolhida.md` detalhando VPS com Docker Compose, MinIO, subdomínios e rotinas de backup e primeiro admin via `admin:create`. (PR #59, 10/10)

- [x] **T-27 Smoke test pós-deploy.** Roteiro manual estruturado em `docs/operacao/smoke.md` cobrindo todas as etapas: liveness/readiness (`/healthz` e `/readyz`), cadastro de cliente e de profissional, publicação de anúncio, aprovação pelo admin, feed público, simulação e envio de card de briefing no chat, resposta em tempo real, convite e submissão de avaliação, denúncia e suspensão moderativa, e logout. Execução local validada contra a suíte ponta a ponta. (PR #60, 10/10)

- [x] **T-28 Bateria de testes de estresse, resiliência e consolidação.** Ao concluir a Fase 2: suíte de concorrência e estresse na API (20 mensagens paralelas, 10 subscribers SSE simultâneos, race condition de avaliação e 50 requisições simultâneas) e no web (rajadas de filtros, double-submit e navegações rápidas). Relatório consolidado em `docs/historico/relatorios/2026-10-10-bateria-de-estresse-resiliencia-e-consolidacao.md` com 158 testes unitários/integração e 78 testes E2E aprovados. Fase 2 concluída com sucesso. (PR #61, 10/10)

## 6. Fase 3 — monetização (parada por decisão, não por falta de código)

Reabrir quando o Daniel decidir cobrar. Nada aqui bloqueia o ar.

- [ ] **T-30 Escolher PSP** que aceite o vertical, com Pix e recorrência (ADR-006 lista o risco). Registrar em ADR.
- [ ] **T-31 Implementar `BillingProvider` real** em `apps/api/src/lib/billing/<psp>-provider.ts` (`createCheckout`, `cancelSubscription`, `verifyWebhook` com a assinatura do PSP). Adicionar o nome ao enum `BILLING_PROVIDER` em `config.ts` e escolher o provedor em `server.ts`. Testes de integração com webhook assinado, como os do fake.
- [ ] **Concessão manual com assinatura pendente do PSP.** Hoje (decisão de 10/11, PR complementar do F-03) `admin.grantPremium` recusa com `CONFLICT` quando há assinatura do provedor em `pending_payment` e não cancela nada localmente. Quando o PSP real existir (T-31), rever se a concessão manual deve cancelar a assinatura pendente no provedor.
- [ ] **T-32 Ligar checkout na UI** (`PREMIUM_CHECKOUT_ENABLED=true`): `premium-subscription-checkout-screen.tsx` redireciona para `checkoutUrl`; tela de retorno; estado `pending_payment` e `past_due` visíveis. Preços continuam vindo de `PREMIUM_PLAN_OPTIONS`.
- [ ] **T-33 SMS para verificação de telefone** (provedor a definir) e `VERIFICATION_REQUIRED=true` se fizer sentido.
- [ ] **T-34 Moderação de mídia** em `media.moderate` (API externa ou fila de revisão humana no admin).

## 6.1 CI/CD

Itens de CI/CD registrados ao longo das fases. Nada aqui bloqueia o ar.

- [x] **T-71 Playwright da CI com log da API e falha cedo.** (PR #98, 12/10: logs dos dois webServers em artifact `webserver-logs-*`, `maxFailures: 5`, `timeout-minutes: 20`, E2E da CI contra o build standalone igual ao do Dockerfile, ruleset da `main` com `required_status_checks` estrito e merge só por `gh pr merge --auto`) Origem: achado de 11/10 em `docs/correcoes-juridico.md` seção 6 (run 38179815732 da `main` em `aa2dc30`: 51 testes falharam desde o primeiro, 45 s × 3 tentativas cada, até o timeout de 60 min; o rerun do mesmo commit passou 84/84 em 2,8 min; o log não tinha a saída da API, então a causa ficou desconhecida).
  - **Fazer:** (1) o webServer da API no `apps/web/playwright.config.ts` passa a mandar stdout e stderr para o log da CI (`stdout: "pipe"`, `stderr: "pipe"`), sem dado pessoal (o redact do pino já cobre); (2) `maxFailures` na CI para encerrar a run quando muitos testes falham em sequência, em vez de queimar o timeout do workflow (valor a definir na task); (3) conferir se o `timeout-minutes` do `playwright.yml` ainda faz sentido com isso.
  - **Arquivos prováveis:** `apps/web/playwright.config.ts`, `.github/workflows/playwright.yml`.
  - **Pronto quando:** uma run com a API derrubada de propósito (numa branch) mostra a saída da API no log e termina em poucos minutos.

- [x] **CI com o checkout ligado.** (job `E2E (checkout-ligado)`, PR #98) Job de Playwright com `PREMIUM_CHECKOUT_ENABLED=true` para cobrir o `PremiumConversionModal` (com o checkout desligado o `premium-conversion-modal-scroll-gate.spec.ts` fica sempre pulado). Registrado em 12/10.
- [ ] **E2E com upload real de mídia.** Nenhum spec envia arquivo; a URL pública e o job de mídia só são cobertos pelos testes da API. Registrado em 12/10.
- [x] **Ordem seed/migrate na E2E local.** (PR #98) `npm run test:e2e` roda a seed antes de as migrations novas estarem aplicadas no banco local. Registrado em 12/10.
- [x] **Build do web sem rede para fontes.** (`next/font/local` com os `.woff2` e licenças OFL em `apps/web/app/fonts/`, PR #98) O `next build` busca fontes no Google (`next/font/google`) e falhou uma vez por rede (#93). Avaliar `next/font/local`. Registrado em 12/10.

## 7. Decisões pendentes

As decisões P-01 a P-05 deste arquivo estão resolvidas (registradas nas tasks T-22 a T-26 e nos ADRs 007 e 018). Pendências abertas:

- P-11: destino externo do backup (`docs/correcoes-pre-deploy.md`, seção 5).
- P-12: texto jurídico de Termos e Privacidade, identificação do controlador e contato do encarregado (`docs/correcoes-pre-deploy.md`, seção 5). Bloqueia o lançamento público.
- Decisões da Fase F ainda sem resposta: seção de decisões de `docs/faxina-inventario.md` e "Achados novos" das trilhas.

## Histórico deste arquivo

- 04/10/2026: criado a partir da análise completa da `main` (Claude). Decisões D-01 a D-08 registradas com o Daniel.
- 12/11/2026: estado atualizado para a `v0.2.0` e a Fase F; Fases 0 e 1 resumidas; mapa de arquivos mock removido (F-14a).
