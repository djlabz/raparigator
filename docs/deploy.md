# Guia de Deploy e Operação em Produção — Sigillus

Este documento descreve o procedimento operacional para colocar a plataforma Sigillus no ar em uma **VPS com Docker Compose** (conforme [ADR-007](adr/007-infra-escolhida.md)).

---

## 1. Requisitos do Servidor (VPS)

- **Sistema Operacional:** Ubuntu 24.04 LTS (ou Debian 12).
- **Recursos recomendados:**
  - Mínimo: 4 GB de memória RAM, 2 vCPUs, 40 GB SSD.
  - Recomendado: 8 GB de memória RAM, 4 vCPUs, 80 GB SSD (NVMe).
- **Softwares instalados:**
  - Docker Engine (v28+) e Docker Compose (v2.27+). Antes da v28, uma porta publicada em `127.0.0.1` ainda pode ser alcançada por máquinas do mesmo segmento de rede.
  - Proxy reverso com TLS automático (ex.: **Caddy** ou **Nginx + Certbot**).
  - Portas liberadas no firewall/UFW: `80` (HTTP), `443` (HTTPS) e `22` (SSH).
  - O UFW **não** protege portas publicadas pelo Docker (o Docker roteia o tráfego antes das regras do UFW). Por isso o `compose.prod.yaml` publica `3000`, `4000` e `9000` só em `127.0.0.1` e não publica o Postgres nem o console do MinIO.
  - Acesso administrativo: Postgres com `docker compose -f compose.prod.yaml --env-file .env.prod exec postgres psql -U sigillus sigillus`; console do MinIO por túnel SSH até a porta `9001` do container `minio` (IP via `docker inspect`).

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
    reverse_proxy 127.0.0.1:9000
}
```

O bloco de `media.` não pode ter `rewrite`: as URLs pré-assinadas de upload e visualização são geradas pela API com `S3_PUBLIC_ENDPOINT` (path-style, bucket no caminho) e a assinatura SigV4 inclui o `Host` e o caminho. O `reverse_proxy` do Caddy preserva o `Host` original, que é o que o MinIO usa para validar a assinatura.

---

## 4. Checklist de Variáveis de Ambiente (`.env.prod`)

Crie o arquivo `.env.prod` na raiz do projeto na VPS a partir do template:

```bash
cp .env.prod.example .env.prod
chmod 600 .env.prod
```

Preencha os valores obrigatórios:

| Chave                       | Exemplo de Produção                           | Obrigatório | Descrição                                                  |
| --------------------------- | --------------------------------------------- | ----------- | ---------------------------------------------------------- |
| `POSTGRES_USER`             | `sigillus`                                    | Sim         | Usuário do banco de dados                                  |
| `POSTGRES_PASSWORD`         | `<senha-gerada-aleatoria>`                    | Sim         | Senha forte exclusiva                                      |
| `POSTGRES_DB`               | `sigillus`                                    | Sim         | Nome da base de dados                                      |
| `AUTH_SECRET`               | `<32-bytes-aleatorios-hex>`                   | Sim         | Chave de criptografia de sessão (`openssl rand -hex 32`)   |
| `WEB_ORIGIN`                | `https://app.seudominio.com`                  | Sim         | URL base do Web para validação de CORS e links             |
| `CORS_ORIGINS`              | `https://app.seudominio.com`                  | Sim         | Origens permitidas pela API                                |
| `COOKIE_DOMAIN`             | `.seudominio.com`                             | Sim         | Permite compartilhamento de sessão entre `app.` e `api.`   |
| `API_ORIGIN`                | `https://api.seudominio.com`                  | Sim         | URL pública da API (`baseURL` do better-auth)              |
| `NEXT_PUBLIC_API_URL`       | `https://api.seudominio.com`                  | Sim         | URL pública da API consumida pelo cliente Web              |
| `S3_PUBLIC_ENDPOINT`        | `https://media.seudominio.com`                | Sim         | Endpoint público usado só para assinar URLs de upload/view |
| `S3_PUBLIC_BASE_URL`        | `https://media.seudominio.com/sigillus-media` | Sim         | URL pública (com o bucket) para carregar imagens e vídeos  |
| `S3_ACCESS_KEY_ID`          | `sigillus`                                    | Sim         | Chave de acesso do MinIO                                   |
| `S3_SECRET_ACCESS_KEY`      | `<secret-gerado-aleatorio>`                   | Sim         | Chave secreta do MinIO (`openssl rand -hex 32`)            |
| `S3_BUCKET`                 | `sigillus-media`                              | Sim         | Nome do bucket                                             |
| `BILLING_PROVIDER`          | `fake`                                        | Sim         | Enquanto lançamento for gratuito (ADR-006 / D-01)          |
| `BILLING_FAKE_ACKNOWLEDGED` | `true`                                        | Sim         | Confirmação explícita de uso do billing gratuito           |
| `BILLING_WEBHOOK_SECRET`    | `<64-hex-aleatorios>`                         | Sim         | Mínimo 16 caracteres; gere com `openssl rand -hex 32`      |
| `MAIL_PROVIDER`             | `resend`                                      | Sim         | Provedor de e-mail transacional                            |
| `RESEND_API_KEY`            | `re_123456789...`                             | Sim         | Chave de API do Resend                                     |
| `MAIL_FROM`                 | `Sigillus <nao-responda@seudominio.com>`      | Sim         | Remetente com domínio autenticado no Resend                |
| `VERIFICATION_REQUIRED`     | `false`                                       | Sim         | Verificação de contato opcional no lançamento              |
| `VERIFICATION_DEV_CODES`    | `false`                                       | Sim         | **Obrigatório false** em produção                          |
| `OPENAPI_DOCS_ENABLED`      | `false`                                       | Sim         | Desativa Swagger/Docs públicos em produção                 |
| `RATE_LIMIT_ENABLED`        | `true`                                        | Sim         | Limita tentativas de login e envio (padrão `true`)         |

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
  node dist/create-admin.js \
  --email="admin@seudominio.com" \
  --name="Administrador Sigillus" \
  --password="<SenhaForteComPeloMenos8Caracteres>"
```

Acesse `https://app.seudominio.com/admin/login` e realize o login para validar o acesso.

---

## 7. Rotina de Backup Automático

O backup é feito pelo script versionado `scripts/backup.sh`, que gera a cada execução:

- `postgres_<data>.sql.gz`: dump do Postgres (`pg_dump --clean --if-exists --no-owner`) com o `POSTGRES_USER` e o `POSTGRES_DB` lidos do arquivo de ambiente;
- `media_<data>/`: cópia do bucket `S3_BUCKET` feita com `mc mirror`, rodando a imagem do serviço `minio-init` na rede do compose.

Os dois seguem a mesma retenção. O backup externo (fora da VPS) ainda não está definido (P-11 em `docs/correcoes-pre-deploy.md`); o script tem um ponto de extensão comentado para isso.

Parâmetros (variáveis de ambiente, todas opcionais):

| Variável               | Padrão                       | Descrição                                      |
| ---------------------- | ---------------------------- | ---------------------------------------------- |
| `COMPOSE_FILE`         | `<repo>/compose.prod.yaml`   | Compose da stack de produção                   |
| `ENV_FILE`             | `<repo>/.env.prod`           | Arquivo de ambiente usado na subida da stack   |
| `BACKUP_DIR`           | `/var/backups/sigillus`      | Diretório local dos backups (criado com `700`) |
| `RETENTION_DAYS`       | `14`                         | Dias de retenção dos dumps e cópias de mídia   |
| `COMPOSE_PROJECT_NAME` | nome do diretório do compose | Só se a stack subiu com `-p` próprio           |

Execução manual (como root, na raiz do projeto na VPS):

```bash
cd /opt/sigillus
./scripts/backup.sh
```

Adicione ao cron diário do root (`crontab -e`):

```cron
0 3 * * * cd /opt/sigillus && ./scripts/backup.sh >> /var/log/sigillus-backup.log 2>&1
```

### 7.1 Restauração do Postgres

1. Escolha o dump e pare quem escreve no banco:

   ```bash
   cd /opt/sigillus
   docker compose -f compose.prod.yaml --env-file .env.prod stop web api
   ```

2. Restaure. O dump já traz `DROP ... IF EXISTS`, então pode ser aplicado sobre o banco atual; o usuário e o banco vêm das variáveis do próprio container:

   ```bash
   gunzip -c /var/backups/sigillus/postgres_<data>.sql.gz |
     docker compose -f compose.prod.yaml --env-file .env.prod exec -T postgres \
     sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
   ```

3. Suba de novo e confira os healthchecks:

   ```bash
   docker compose -f compose.prod.yaml --env-file .env.prod up -d api web
   docker compose -f compose.prod.yaml --env-file .env.prod ps
   ```

Para conferir um dump sem tocar no banco de produção, restaure num banco vazio e compare contagens:

```bash
docker compose -f compose.prod.yaml --env-file .env.prod exec -T postgres \
  sh -c 'createdb -U "$POSTGRES_USER" sigillus_restore'
gunzip -c /var/backups/sigillus/postgres_<data>.sql.gz |
  docker compose -f compose.prod.yaml --env-file .env.prod exec -T postgres \
  sh -c 'psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d sigillus_restore'
docker compose -f compose.prod.yaml --env-file .env.prod exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d sigillus_restore -c "select count(*) from \"user\""'
docker compose -f compose.prod.yaml --env-file .env.prod exec -T postgres \
  sh -c 'dropdb -U "$POSTGRES_USER" sigillus_restore'
```

### 7.2 Restauração da mídia

O `mc mirror` copia de volta para o bucket o diretório `media_<data>` escolhido (objetos existentes com o mesmo nome são sobrescritos; objetos que não estão no backup são mantidos):

```bash
cd /opt/sigillus
export S3_BUCKET="$(grep -E '^S3_BUCKET=' .env.prod | cut -d= -f2-)"
export S3_ACCESS_KEY_ID="$(grep -E '^S3_ACCESS_KEY_ID=' .env.prod | cut -d= -f2-)"
export S3_SECRET_ACCESS_KEY="$(grep -E '^S3_SECRET_ACCESS_KEY=' .env.prod | cut -d= -f2-)"

docker compose -f compose.prod.yaml --env-file .env.prod run --rm --no-deps -T \
  -e S3_BUCKET -e S3_ACCESS_KEY_ID -e S3_SECRET_ACCESS_KEY \
  -v /var/backups/sigillus/media_<data>:/backup:ro \
  --entrypoint /bin/sh minio-init -c '
    mc --config-dir /tmp/mc alias set local http://minio:9000 "$S3_ACCESS_KEY_ID" "$S3_SECRET_ACCESS_KEY" >/dev/null &&
    mc --config-dir /tmp/mc mb --ignore-existing local/"$S3_BUCKET" &&
    mc --config-dir /tmp/mc mirror --overwrite /backup local/"$S3_BUCKET" &&
    mc --config-dir /tmp/mc anonymous set download local/"$S3_BUCKET"/public
  '
```

O `mb --ignore-existing` e o `anonymous set download` recriam o bucket e a leitura pública do prefixo `public/` quando a restauração é feita num MinIO novo (volume perdido). Confira a contagem de objetos contra o backup com `find /var/backups/sigillus/media_<data> -type f | wc -l`.

---

## 8. Procedimento de Atualização (Deploy Contínuo)

Para atualizar a aplicação quando novos commits forem mesclados na `main`:

```bash
git pull origin main
docker compose -f compose.prod.yaml --env-file .env.prod up -d --build
```

O Drizzle aplicará automaticamente as novas migrations no boot da API sem intervenção manual.
