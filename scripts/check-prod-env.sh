#!/usr/bin/env bash
# scripts/check-prod-env.sh
# Valida as configurações e segredos de produção antes do deploy.

set -euo pipefail

ENV_FILE="${1:-.env.prod}"

echo "==> Verificando arquivo de ambiente: $ENV_FILE"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: Arquivo $ENV_FILE não encontrado."
  echo "Copie .env.prod.example para $ENV_FILE e preencha os valores antes de subir a stack."
  exit 1
fi

ERRORS=0

read_var() {
  grep -E "^${1}=" "$ENV_FILE" | head -n 1 | cut -d'=' -f2- | tr -d '\r"' || true
}

fail() {
  echo "  [FALHA] $1"
  ERRORS=$((ERRORS + 1))
}

check_var() {
  local var_name="$1"
  local val
  val=$(read_var "$var_name")

  if [ -z "$val" ]; then
    fail "$var_name não está definida ou está vazia."
    return 1
  fi

  if [[ "$val" == *"CHANGE_ME"* ]]; then
    fail "$var_name ainda contém o placeholder CHANGE_ME do template: '$val'"
    return 1
  fi

  echo "  [OK] $var_name está configurada."
}

check_secret() {
  local var_name="$1"
  local val
  check_var "$var_name" || return 0
  val=$(read_var "$var_name")
  if [ "${#val}" -lt 32 ]; then
    fail "$var_name deve ter pelo menos 32 caracteres (atual: ${#val}). Gere com: openssl rand -hex 32"
  else
    echo "  [OK] $var_name possui tamanho seguro (${#val} caracteres)."
  fi
}

check_public_url() {
  local var_name="$1"
  local url="$2"
  if [[ "$url" != https://* ]]; then
    fail "$var_name deve começar com https:// em produção: '$url'"
  elif [[ "$url" == *localhost* ]] || [[ "$url" == *127.0.0.1* ]]; then
    fail "$var_name não pode apontar para localhost/127.0.0.1 em produção: '$url'"
  else
    echo "  [OK] $var_name usa HTTPS público: $url"
  fi
}

check_url_var() {
  local var_name="$1"
  check_var "$var_name" || return 0
  check_public_url "$var_name" "$(read_var "$var_name")"
}

echo "1. Validando credenciais de banco e chaves de segurança..."
check_var "POSTGRES_PASSWORD" || true
check_var "S3_SECRET_ACCESS_KEY" || true
check_secret "AUTH_SECRET"
check_secret "BILLING_WEBHOOK_SECRET"

echo "2. Validando URLs e domínios..."
check_url_var "WEB_ORIGIN"
check_url_var "API_ORIGIN"
check_url_var "NEXT_PUBLIC_API_URL"
check_url_var "S3_PUBLIC_BASE_URL"
if grep -qE "^S3_PUBLIC_ENDPOINT=" "$ENV_FILE"; then
  check_url_var "S3_PUBLIC_ENDPOINT"
fi

if check_var "CORS_ORIGINS"; then
  IFS=',' read -r -a CORS_LIST <<<"$(read_var "CORS_ORIGINS")"
  for origin in "${CORS_LIST[@]}"; do
    origin="${origin//[[:space:]]/}"
    [ -z "$origin" ] && continue
    check_public_url "CORS_ORIGINS ($origin)" "$origin"
  done
fi

if check_var "COOKIE_DOMAIN"; then
  COOKIE_DOMAIN=$(read_var "COOKIE_DOMAIN")
  if [[ "$COOKIE_DOMAIN" != .* ]]; then
    fail "COOKIE_DOMAIN deve começar com um ponto (ex: .seudominio.com). Valor atual: '$COOKIE_DOMAIN'"
  else
    echo "  [OK] COOKIE_DOMAIN configurado com ponto inicial: $COOKIE_DOMAIN"
  fi
fi

echo "3. Validando flags de produção..."
RATE_LIMIT=$(read_var "RATE_LIMIT_ENABLED")
if [ "$RATE_LIMIT" != "true" ]; then
  fail "RATE_LIMIT_ENABLED deve ser 'true' em produção (atual: '$RATE_LIMIT')."
else
  echo "  [OK] RATE_LIMIT_ENABLED=true."
fi

IDENTITY_REQUIRED=$(read_var "IDENTITY_REQUIRED")
if [ "$IDENTITY_REQUIRED" != "true" ]; then
  fail "IDENTITY_REQUIRED deve ser 'true' em produção (atual: '$IDENTITY_REQUIRED')."
else
  echo "  [OK] IDENTITY_REQUIRED=true."
fi

DEV_CODES=$(grep -E "^VERIFICATION_DEV_CODES=" "$ENV_FILE" | head -n 1 | cut -d'=' -f2- | tr -d '\r"' || true)
if [ "$DEV_CODES" = "true" ]; then
  echo "  [FALHA] VERIFICATION_DEV_CODES não pode ser 'true' em produção."
  ERRORS=$((ERRORS + 1))
else
  echo "  [OK] VERIFICATION_DEV_CODES=false."
fi

OPENAPI_DOCS=$(grep -E "^OPENAPI_DOCS_ENABLED=" "$ENV_FILE" | head -n 1 | cut -d'=' -f2- | tr -d '\r"' || true)
if [ "$OPENAPI_DOCS" = "true" ]; then
  echo "  [AVISO] OPENAPI_DOCS_ENABLED=true deixa a documentação Swagger pública em produção."
else
  echo "  [OK] OPENAPI_DOCS_ENABLED desativado em produção."
fi

echo "4. Validando faturamento (modo gratuito)..."
BILLING_PROVIDER=$(grep -E "^BILLING_PROVIDER=" "$ENV_FILE" | head -n 1 | cut -d'=' -f2- | tr -d '\r"' || true)
BILLING_ACK=$(grep -E "^BILLING_FAKE_ACKNOWLEDGED=" "$ENV_FILE" | head -n 1 | cut -d'=' -f2- | tr -d '\r"' || true)

if [ "$BILLING_PROVIDER" = "fake" ] && [ "$BILLING_ACK" != "true" ]; then
  echo "  [FALHA] BILLING_PROVIDER=fake exige BILLING_FAKE_ACKNOWLEDGED=true para lançamento gratuito."
  ERRORS=$((ERRORS + 1))
else
  echo "  [OK] Faturamento gratuito configurado com confirmação explícita."
fi

echo "5. Validando e-mail transacional..."
MAIL_PROVIDER=$(grep -E "^MAIL_PROVIDER=" "$ENV_FILE" | head -n 1 | cut -d'=' -f2- | tr -d '\r"' || true)
if [ "$MAIL_PROVIDER" = "resend" ]; then
  check_var "RESEND_API_KEY" || true
  check_var "MAIL_FROM" || true
fi

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "❌ Verificação concluída com $ERRORS erro(s). Corrija o $ENV_FILE antes do deploy."
  exit 1
else
  echo "✅ Verificação concluída com sucesso! $ENV_FILE está pronto para deploy."
fi
