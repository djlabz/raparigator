# ADR-007 — Infraestrutura de Deploy: VPS Única com Docker Compose e Subdomínios

- Status: aceito (2026-10-10)

## Contexto

Com a conclusão da virada definitiva para a API (ADR-016), a remoção de mocks e a implementação dos fluxos de produção (reset de senha por e-mail via Resend, termos/privacidade, exclusão LGPD e Dockerfile multi-stage do Web no ADR-006 / T-25), fez-se necessária a definição da arquitetura de hospedagem para colocar a plataforma no ar.

As decisões pendentes P-03 (modelo de hospedagem) e P-04 (estratégia de domínios e cookies) foram alinhadas com o operador da plataforma.

## Opções consideradas

### Hospedagem (P-03)

1. **VPS única com Docker Compose (Escolhida)**: Uma máquina virtual (ex.: Hetzner, DigitalOcean, Linode ou Contabo) com 4 a 8 GB de RAM rodando a stack completa (`api`, `web`, `postgres`, `minio`) via `compose.prod.yaml`. Custo previsível e reduzido (US$ 5 a 20/mês), zero complexidade de rede entre provedores heterogêneos e independência de vendors.
2. **PaaS de containers (Fly.io / Railway / Render) + Postgres gerenciado (Neon / Supabase) + Cloudflare R2**: Separação de camadas que aumenta o custo mensal mínimo e adiciona latência de rede entre a API e o banco de dados.
3. **Vercel para Web + Container para API**: Modelo fragmentado que encarece o tráfego e bandwidth do Web (Next.js SSR/ISR com mídias) e adiciona complexidade de proxy/CORS.

### Estratégia de Domínios e Cookies (P-04)

1. **Subdomínios separados (Escolhida)**: `app.<dominio>` para o Web e `api.<dominio>` para a API, compartilhando autenticação via `COOKIE_DOMAIN=.<dominio>`. Mantém responsabilidades de cache e roteamento desacopladas, aproveitando a arquitetura nativa já testada na aplicação.
2. **Proxy reverso na mesma origem**: Um proxy único roteando `/api/*` e a raiz. Traz maior dependência da configuração do proxy reverso para streaming (SSE) e headers de autenticação.

## Decisão

Adota-se o modelo de **VPS única com Docker Compose** e **subdomínios separados**.

### 1. Componentes da Stack (`compose.prod.yaml`)

- **API (`sigillus-api:latest`)**: Container Node.js 22 Alpine rodando a API Hono/oRPC na porta interna 4000.
- **Web (`sigillus-web:latest`)**: Container Node.js 22 Alpine rodando Next.js 16 em modo standalone na porta interna 3000.
- **Postgres 17 (`postgres:17-alpine`)**: Banco relacional persistido no volume nomeado `postgres-data`. A extensão `pg_trgm` é habilitada para as buscas textuais do feed.
- **MinIO (`cgr.dev/chainguard/minio`, pinado por digest desde a T-40)**: Servidor S3 self-hosted persistido no volume nomeado `minio-data`, com serviço `minio-init` que cria o bucket `sigillus-media` e define a política pública de download no prefixo `/public`.

### 2. Rede, TLS e Proxy Reverso

- Na VPS, utiliza-se um proxy reverso (ex.: Caddy ou Nginx com Certbot) gerenciando certificados SSL/TLS automáticos da Let's Encrypt:
  - `https://app.<dominio>` → encaminha para `http://127.0.0.1:3000` (Web)
  - `https://api.<dominio>` → encaminha para `http://127.0.0.1:4000` (API)
  - `https://media.<dominio>` → encaminha para `http://127.0.0.1:9000` sem reescrita de caminho (MinIO; bucket no caminho, path-style)

### 3. Autenticação e Cookies

- `COOKIE_DOMAIN=.<dominio>`: Permite que cookies de sessão emitidos pela API em `api.<dominio>` sejam enviados pelo navegador nas requisições originadas de `app.<dominio>`.
- Cookies marcados com `HttpOnly`, `Secure` e `SameSite=Lax`.
- `WEB_ORIGIN=https://app.<dominio>` e `CORS_ORIGINS=https://app.<dominio>`.

### 4. Ciclo de Vida e Migrações

- `MIGRATE_ON_BOOT=true`: As migrations do Drizzle rodam automaticamente no boot da API, garantindo sincronia imediata entre schema e aplicação a cada deploy ou reinicialização.
- Migrações são idempotentes e transacionais (ADR-004).

### 5. Operação e Backups

- **Backup**: cron diário rodando `scripts/backup.sh` (T-48), que gera o dump do Postgres e a cópia do bucket com `mc mirror`, com retenção local. Procedimento e restauração em `docs/deploy.md` seção 7.
- **Criação do primeiro Admin**: Executada após a primeira subida via comando CLI:
  ```bash
  docker compose -f compose.prod.yaml --env-file .env.prod exec api node dist/create-admin.js --email="admin@<dominio>" --name="Admin" --password="<senha-forte>"
  ```

## Consequências

- **Positivas**: Custo mensal reduzido e previsível; instalação e restauração simples através de um único arquivo declarativo (`compose.prod.yaml` e `.env.prod`); baixa latência de comunicação interna entre API, Postgres e MinIO pela rede Docker bridge; arquitetura resiliente e independente.
- **Pontos de atenção**: Como todos os componentes residem na mesma VPS, recursos de CPU e memória devem ser dimensionados conforme a carga de mídia e acessos (mínimo recomendado: 4 GB de RAM, 2 vCPUs e 40 GB de SSD/NVMe).

## Emendas

- **T-43 (10/2026)**: as URLs pré-assinadas são geradas por um segundo client S3 com `S3_PUBLIC_ENDPOINT` (`https://media.<dominio>`), porque a assinatura SigV4 inclui o host e o navegador não alcança `http://minio:9000`. Operações servidor→MinIO continuam em `S3_ENDPOINT`. `S3_PUBLIC_BASE_URL` passa a incluir o bucket e o Caddy de `media.` não usa `rewrite`.
- **T-40 (10/2026)**: o `compose.prod.yaml` publica `web` (3000), `api` (4000) e `minio` (9000) só em `127.0.0.1`; o Postgres e o console do MinIO (9001) não são publicados (acesso por `docker compose ... exec postgres psql` e túnel SSH). A imagem do MinIO (e do `minio-init`) é pinada por digest em vez de `:latest`. O serviço `api` passa a exigir `API_ORIGIN` e `BILLING_WEBHOOK_SECRET` (`${VAR:?}`, o Compose falha sem valor) e recebe `RATE_LIMIT_ENABLED=true` por padrão.
- **T-48 (10/2026)**: o backup é o script versionado `scripts/backup.sh` (dump do Postgres com `pg_dump --clean --if-exists --no-owner` e cópia do bucket com `mc mirror` pela imagem do `minio-init`, retenção padrão de 14 dias). O destino externo segue em aberto (P-11).
- **T-50 (10/2026)**: o `minio-init` recebe `environment` próprio (`MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` e `S3_BUCKET`, das mesmas variáveis do `minio` e da `api`); antes disso o bucket e a leitura pública de `public/` não eram criados em produção.
- **T-49 (10/2026)**: todo comando `docker compose -f compose.prod.yaml` precisa de `--env-file .env.prod`, inclusive `ps`, `logs` e `exec`; sem ele a interpolação das variáveis obrigatórias falha antes de o comando rodar.
