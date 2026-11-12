# Architecture Decision Records

Formato curto: Contexto / Opções consideradas / Decisão / Consequências. Um arquivo por decisão, numerado, imutável depois de aceito (mudou de ideia? novo ADR que substitui o antigo).

| ADR                                                   | Decisão                                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| [001](001-linguagem-do-backend.md)                    | Backend em TypeScript, no monorepo, com contrato e domínio compartilhados |
| [002](002-runtime-e-gerenciador-de-pacotes.md)        | Node LTS + npm workspaces                                                 |
| [003](003-framework-http.md)                          | Hono + oRPC contract-first + Zod 4                                        |
| [004](004-orm-e-migrations.md)                        | Drizzle SQL-first; migrations em CI e no boot                             |
| [005](005-filas-e-tempo-real.md)                      | pg-boss no Postgres; chat por LISTEN/NOTIFY + SSE                         |
| [006](006-deploy.md)                                  | Deploy agnóstico: Dockerfile, env, healthz, migrations idempotentes       |
| [007](007-infra-escolhida.md)                         | Infraestrutura de deploy: VPS única com Docker Compose e subdomínios      |
| 008 a 015                                             | Migração do web para a API, módulo a módulo: fundidos no 016              |
| [016](016-virada-api-e-remocao-dos-mocks.md)          | Web consome só a API (auth, mídia, chat e premium no web)                 |
| [018](018-lancamento-gratuito-e-premium-manual.md)    | Lançamento gratuito e Premium concedido pelo admin                        |
| [019](019-autenticacao-duas-instancias.md)            | Duas instâncias do better-auth e campos sensíveis fora do `update-user`   |
| [021](021-observabilidade-e-limites-por-instancia.md) | Log sem dado pessoal, Sentry, saúde e rate limit por instância            |

Os ADRs 008 a 015 ficam como stubs com link para o texto original em `docs/historico/adr/`.

## Restrição de produto que atravessa todos os ADRs

Desde 14/08/2026 a plataforma é **vitrine de anúncios**. Nenhum dinheiro de cliente transita pela plataforma; o único fluxo monetário é profissional → plataforma (assinatura premium). A plataforma não organiza, intermedeia nem acompanha encontro. É proibido reintroduzir em schema, endpoint, tipo, tabela ou copy: escrow, custódia, split, taxa sobre serviço, booking, agendamento, valor de atendimento, check-in/out de encontro. O `EncounterBrief` é estimativa de preço a partir do anúncio, viaja como payload de mensagem e não gera registro de serviço.

## Histórico

A migração do `apps/web` dos mocks locais para a API foi concluída entre 08 e 10/10/2026 (tasks T-10 a T-19), e os ramos dual-mode que sobraram saíram na T-47 (PR #71). As decisões que continuam valendo estão no ADR-016; o passo a passo está em `docs/historico/`.
