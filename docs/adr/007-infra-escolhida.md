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
- **MinIO (`quay.io/minio/minio:latest`)**: Servidor S3 self-hosted persistido no volume nomeado `minio-data`, com serviço `minio-init` que cria o bucket `sigillus-media` e define a política pública de download no prefixo `/public`.

### 2. Rede, TLS e Proxy Reverso

- Na VPS, utiliza-se um proxy reverso (ex.: Caddy ou Nginx com Certbot) gerenciando certificados SSL/TLS automáticos da Let's Encrypt:
  - `https://app.<dominio>` → encaminha para `http://127.0.0.1:3000` (Web)
  - `https://api.<dominio>` → encaminha para `http://127.0.0.1:4000` (API)
  - `https://media.<dominio>` → encaminha para `http://127.0.0.1:9000/sigillus-media` (MinIO público com cache de imagens/vídeos)

### 3. Autenticação e Cookies

- `COOKIE_DOMAIN=.<dominio>`: Permite que cookies de sessão emitidos pela API em `api.<dominio>` sejam enviados pelo navegador nas requisições originadas de `app.<dominio>`.
- Cookies marcados com `HttpOnly`, `Secure` e `SameSite=Lax`.
- `WEB_ORIGIN=https://app.<dominio>` e `CORS_ORIGINS=https://app.<dominio>`.

### 4. Ciclo de Vida e Migrações

- `MIGRATE_ON_BOOT=true`: As migrations do Drizzle rodam automaticamente no boot da API, garantindo sincronia imediata entre schema e aplicação a cada deploy ou reinicialização.
- Migrações são idempotentes e transacionais (ADR-004).

### 5. Operação e Backups

- **Backup do Postgres**: Script cron diário executando `docker compose -f compose.prod.yaml exec -T postgres pg_dump -U sigillus sigillus | gzip > /backups/postgres_$(date +%Y%m%d).sql.gz`.
- **Backup do MinIO**: Sincronização periódica do volume `minio-data` ou via `mc mirror` para storage secundário externo.
- **Criação do primeiro Admin**: Executada após a primeira subida via comando CLI:
  ```bash
  docker compose -f compose.prod.yaml exec api node dist/cli/create-admin.js --email="admin@<dominio>" --name="Admin" --password="<senha-forte>"
  ```

## Consequências

- **Positivas**: Custo mensal reduzido e previsível; instalação e restauração simples através de um único arquivo declarativo (`compose.prod.yaml` e `.env.prod`); baixa latência de comunicação interna entre API, Postgres e MinIO pela rede Docker bridge; arquitetura resiliente e independente.
- **Pontos de atenção**: Como todos os componentes residem na mesma VPS, recursos de CPU e memória devem ser dimensionados conforme a carga de mídia e acessos (mínimo recomendado: 4 GB de RAM, 2 vCPUs e 40 GB de SSD/NVMe).
