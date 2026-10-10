# Guia de Deploy e Operação em Produção — Sigillus

Este documento descreve o procedimento operacional para colocar a plataforma Sigillus no ar em uma **VPS com Docker Compose** (conforme [ADR-007](adr/007-infra-escolhida.md)).

---

## 1. Requisitos do Servidor (VPS)

- **Sistema Operacional:** Ubuntu 24.04 LTS (ou Debian 12).
- **Recursos recomendados:**
  - Mínimo: 4 GB de memória RAM, 2 vCPUs, 40 GB SSD.
  - Recomendado: 8 GB de memória RAM, 4 vCPUs, 80 GB SSD (NVMe).
- **Softwares instalados:**
  - Docker Engine (v26+) e Docker Compose (v2.27+).
  - Proxy reverso com TLS automático (ex.: **Caddy** ou **Nginx + Certbot**).
  - Portas liberadas no firewall/UFW: `80` (HTTP), `443` (HTTPS) e `22` (SSH). As portas `3000`, `4000`, `5432` e `9000` devem ficar vinculadas a `127.0.0.1` ou protegidas pelo firewall.

---

## 2. Configuração de DNS

Aponte as seguintes entradas do tipo `A` (ou `CNAME`) para o endereço IP público da sua VPS:

| Entrada                | Destino     | Descrição                                   |
| ---------------------- | ----------- | ------------------------------------------- |
| `app.seudominio.com`   | `IP_DA_VPS` | Interface Web (Next.js)                     |
| `api.seudominio.com`   | `IP_DA_VPS` | API Hono / oRPC                             |
| `media.seudominio.com` | `IP_DA_VPS` | Armazenamento de Mídia (MinIO / S3 público) |

---

## 3. Configuração do Proxy Reverso (Exemplo com Caddy)

O [Caddy](https://caddyserver.com/) gerencia certificados SSL Let's Encrypt automaticamente:

```caddyfile
# /etc/caddy/Caddyfile

app.seudominio.com {
    reverse_proxy 127.0.0.1:3000
}

api.seudominio.com {
    reverse_proxy 127.0.0.1:4000 {
        # Suporte a Server-Sent Events (SSE) sem buffering
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
    }
}

media.seudominio.com {
    # Encaminha direto para o bucket de mídias públicas
    rewrite * /sigillus-media{uri}
    reverse_proxy 127.0.0.1:9000
}
```

---

## 4. Checklist de Variáveis de Ambiente (`.env.prod`)

Crie o arquivo `.env.prod` na raiz do projeto na VPS a partir do template:

```bash
cp .env.prod.example .env.prod
chmod 600 .env.prod
```

Preencha os valores obrigatórios:

| Chave                       | Exemplo de Produção                      | Obrigatório | Descrição                                                |
| --------------------------- | ---------------------------------------- | ----------- | -------------------------------------------------------- |
| `POSTGRES_USER`             | `sigillus`                               | Sim         | Usuário do banco de dados                                |
| `POSTGRES_PASSWORD`         | `<senha-gerada-aleatoria>`               | Sim         | Senha forte exclusiva                                    |
| `POSTGRES_DB`               | `sigillus`                               | Sim         | Nome da base de dados                                    |
| `AUTH_SECRET`               | `<32-bytes-aleatorios-hex>`              | Sim         | Chave de criptografia de sessão (`openssl rand -hex 32`) |
| `WEB_ORIGIN`                | `https://app.seudominio.com`             | Sim         | URL base do Web para validação de CORS e links           |
| `CORS_ORIGINS`              | `https://app.seudominio.com`             | Sim         | Origens permitidas pela API                              |
| `COOKIE_DOMAIN`             | `.seudominio.com`                        | Sim         | Permite compartilhamento de sessão entre `app.` e `api.` |
| `NEXT_PUBLIC_API_URL`       | `https://api.seudominio.com`             | Sim         | URL pública da API consumida pelo cliente Web            |
| `S3_PUBLIC_BASE_URL`        | `https://media.seudominio.com`           | Sim         | URL pública para carregar imagens e vídeos               |
| `S3_ACCESS_KEY_ID`          | `sigillus`                               | Sim         | Chave de acesso do MinIO                                 |
| `S3_SECRET_ACCESS_KEY`      | `<secret-gerado-aleatorio>`              | Sim         | Chave secreta do MinIO (`openssl rand -hex 32`)          |
| `S3_BUCKET`                 | `sigillus-media`                         | Sim         | Nome do bucket                                           |
| `BILLING_PROVIDER`          | `fake`                                   | Sim         | Enquanto lançamento for gratuito (ADR-006 / D-01)        |
| `BILLING_FAKE_ACKNOWLEDGED` | `true`                                   | Sim         | Confirmação explícita de uso do billing gratuito         |
| `MAIL_PROVIDER`             | `resend`                                 | Sim         | Provedor de e-mail transacional                          |
| `RESEND_API_KEY`            | `re_123456789...`                        | Sim         | Chave de API do Resend                                   |
| `MAIL_FROM`                 | `Sigillus <nao-responda@seudominio.com>` | Sim         | Remetente com domínio autenticado no Resend              |
| `VERIFICATION_REQUIRED`     | `false`                                  | Sim         | Verificação de contato opcional no lançamento            |
| `VERIFICATION_DEV_CODES`    | `false`                                  | Sim         | **Obrigatório false** em produção                        |
| `OPENAPI_DOCS_ENABLED`      | `false`                                  | Sim         | Desativa Swagger/Docs públicos em produção               |

---

## 5. Subindo a Aplicação

1. Construa as imagens e inicie os containers em segundo plano:

   ```bash
   docker compose -f compose.prod.yaml --env-file .env.prod up -d --build
   ```

2. Verifique o status dos serviços e healthchecks:

   ```bash
   docker compose -f compose.prod.yaml ps
   ```

3. Verifique se as migrations foram aplicadas no boot:

   ```bash
   docker compose -f compose.prod.yaml logs api | grep "migrations aplicadas no boot"
   ```

4. Teste os endpoints de integridade da API:
   ```bash
   curl -i https://api.seudominio.com/healthz
   # Resposta esperada: HTTP/1.1 200 OK {"status":"healthy", ...}

   curl -i https://api.seudominio.com/readyz
   # Resposta esperada: HTTP/1.1 200 OK {"status":"ready", ...}
   ```

---

## 6. Criação do Primeiro Administrador

Após a subida inicial da stack, execute o comando CLI dentro do container da API para criar o administrador do backoffice:

```bash
docker compose -f compose.prod.yaml exec api \
  node dist/cli/create-admin.js \
  --email="admin@seudominio.com" \
  --name="Administrador Sigillus" \
  --password="<SenhaForteComPeloMenos8Caracteres>"
```

Acesse `https://app.seudominio.com/admin/login` e realize o login para validar o acesso.

---

## 7. Rotina de Backup Automático

Crie um script `/opt/sigillus/backup.sh` com permissão `700`:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/sigillus"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# 1. Backup do Postgres
docker compose -f /opt/sigillus/compose.prod.yaml --env-file /opt/sigillus/.env.prod \
  exec -T postgres pg_dump -U sigillus sigillus | gzip > "$BACKUP_DIR/postgres_$DATE.sql.gz"

# 2. Retenção de 14 dias
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +14 -delete
```

Adicione ao cron diário (`crontab -e`):

```cron
0 3 * * * /opt/sigillus/backup.sh > /dev/null 2>&1
```

---

## 8. Procedimento de Atualização (Deploy Contínuo)

Para atualizar a aplicação quando novos commits forem mesclados na `main`:

```bash
git pull origin main
docker compose -f compose.prod.yaml --env-file .env.prod up -d --build
```

O Drizzle aplicará automaticamente as novas migrations no boot da API sem intervenção manual.
