# ADR-021 — Observabilidade e limites por instância

- Status: aceito (2026-11-12), registrando o que a API e o web fazem desde as Fases 2 e J

## Contexto

A plataforma roda numa VPS única (ADR-007), com uma réplica da API, sem Redis (ADR-005). Os logs e os relatórios de erro passam por dados pessoais sensíveis (CPF, telefone, e-mail, conteúdo de chat), que não podem vazar para log nem para serviço externo. Essas escolhas estavam espalhadas no código, no ADR-006 e nas correções da Fase J, sem registro próprio.

## Decisão

- **Log estruturado com redação de dado pessoal.** A API loga com pino (`apps/api/src/lib/logger.ts`), com `redact` cobrindo CPF, e-mail, telefone, mensageiros, senha, conteúdo e saudação de mensagem, destinatário de e-mail, nome, apelido, IP, corpo e os headers de cookie e autorização. Mesmo com a redação, o código não loga corpo de mensagem de chat, CPF, e-mail, telefone nem handle de mensageiro (`AGENTS.md`, "Nunca faça"). `/healthz` e `/readyz` ficam fora do log de requisição.
- **Erros no Sentry, sem coleta automática de dado do usuário.** API (`@sentry/node`) e web (`@sentry/nextjs`) só ligam com `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`; sem DSN, o SDK fica inerte. `sendDefaultPii: false` nos dois (sem IP, cookies e usuário automáticos); tracing e replay desligados por padrão. Não há `beforeSend` limpando a mensagem do erro: uma exceção cujo texto contenha dado pessoal chega ao Sentry como está.
- **Saúde:** `/healthz` responde 200 com o banco acessível e 503 sem ele; `/readyz` responde 503 enquanto a API ainda está subindo (filas e workers) e depois que ela começa a desligar.
- **Rate limit em memória, por instância.** Os procedimentos sensíveis usam o middleware `rateLimited` com as regras de `RATE_LIMITS` (`apps/api/src/lib/rate-limit.ts`, `MemoryRateLimiter`); login e cadastro usam o rate limit de cada instância do better-auth (ADR-019). A chave é o IP do cliente (`resolveClientIp`: primeiro valor de `x-forwarded-for`, depois `x-real-ip`), que o proxy da VPS precisa repassar. Tudo atrás de `RATE_LIMIT_ENABLED` (desligado em dev e na E2E, ligado em produção).

## Consequências

- Com mais de uma réplica da API, cada uma conta as tentativas sozinha e o limite efetivo se multiplica; escalar horizontalmente exige um `RateLimiter` compartilhado (Redis ou Postgres) atrás da mesma interface.
- Se o proxy não mandar `x-forwarded-for`, todos os clientes caem na mesma chave e o limite vira global.
- Campo novo com dado pessoal entra no `redact` do logger no mesmo PR.
- Mensagem de erro não deve carregar dado pessoal; enquanto não houver `beforeSend` com limpeza, essa é a única proteção do lado do Sentry.
