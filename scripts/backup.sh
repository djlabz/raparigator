#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.prod}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/sigillus}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "ERRO: compose não encontrado: $COMPOSE_FILE" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: arquivo de ambiente não encontrado: $ENV_FILE" >&2
  exit 1
fi

if ! [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  echo "ERRO: RETENTION_DAYS precisa ser um inteiro: $RETENTION_DAYS" >&2
  exit 1
fi

env_value() {
  local name="$1"
  local fallback="$2"
  local value
  value="$(grep -E "^${name}=" "$ENV_FILE" | tail -n 1 | cut -d'=' -f2- | tr -d '\r' || true)"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  printf '%s' "${value:-$fallback}"
}

POSTGRES_USER="$(env_value POSTGRES_USER sigillus)"
POSTGRES_DB="$(env_value POSTGRES_DB sigillus)"
S3_BUCKET="$(env_value S3_BUCKET sigillus-media)"
S3_ACCESS_KEY_ID="$(env_value S3_ACCESS_KEY_ID sigillus)"
S3_SECRET_ACCESS_KEY="$(env_value S3_SECRET_ACCESS_KEY "")"

if [ -z "$S3_SECRET_ACCESS_KEY" ]; then
  echo "ERRO: S3_SECRET_ACCESS_KEY vazia em $ENV_FILE" >&2
  exit 1
fi

export S3_BUCKET S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY

compose() {
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

DATE="$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

DUMP_FILE="$BACKUP_DIR/postgres_$DATE.sql.gz"
MEDIA_DIR="$BACKUP_DIR/media_$DATE"

cleanup_partial() {
  rm -f "$DUMP_FILE.partial"
  rm -rf "$MEDIA_DIR.partial"
}
trap cleanup_partial EXIT

echo "==> Postgres: dump de $POSTGRES_DB para $DUMP_FILE"
compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --clean --if-exists |
  gzip >"$DUMP_FILE.partial"
mv "$DUMP_FILE.partial" "$DUMP_FILE"

echo "==> Mídia: espelhando o bucket $S3_BUCKET para $MEDIA_DIR"
mkdir -p "$MEDIA_DIR.partial"
compose run --rm --no-deps -T \
  --user "$(id -u):$(id -g)" \
  -e S3_BUCKET -e S3_ACCESS_KEY_ID -e S3_SECRET_ACCESS_KEY \
  -v "$MEDIA_DIR.partial:/backup" \
  --entrypoint /bin/sh minio-init -c '
    set -e
    mc --config-dir /tmp/mc alias set local http://minio:9000 "$S3_ACCESS_KEY_ID" "$S3_SECRET_ACCESS_KEY" >/dev/null
    mc --config-dir /tmp/mc mirror --quiet local/"$S3_BUCKET" /backup
  '
mv "$MEDIA_DIR.partial" "$MEDIA_DIR"

echo "==> Retenção: removendo backups com mais de $RETENTION_DAYS dias"
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'postgres_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -maxdepth 1 -type d -name 'media_*' -mtime +"$RETENTION_DAYS" -exec rm -rf {} +

# Ponto de extensão (P-11): copiar "$DUMP_FILE" e "$MEDIA_DIR" para o destino externo
# (outro provedor, bucket S3 ou máquina fora da VPS) quando a decisão for tomada.

echo "==> Backup concluído: $DUMP_FILE e $MEDIA_DIR"
