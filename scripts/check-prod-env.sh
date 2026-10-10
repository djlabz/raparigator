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

check_var() {
  local var_name="$1"
  local val
  val=$(grep -E "^${var_name}=" "$ENV_FILE" | head -n 1 | cut -d'=' -f2- | tr -d '\r"' || true)

  if [ -z "$val" ]; then
    echo "  [FALHA] $var_name não está definida ou está vazia."
    ERRORS=$((ERRORS + 1))
    return
  fi

  if [[ "$val" == *"troque-por"* ]] || [[ "$val" == *"<senha"* ]] || [[ "$val" == *"<sua-"* ]] || [[ "$val" == *"<32-bytes"* ]] || [[ "$val" == *"<secret"* ]] || [[ "$val" == *"<re_"* ]] || [[ "$val" == *"<dominio"* ]]; then
    echo "  [FALHA] $var_name contém valor de placeholder inseguro: '$val'"
    ERRORS=$((ERRORS + 1))
    return
  fi

  echo "  [OK] $var_name está configurada."
}

echo "1. Validando credenciais de banco e chaves de segurança..."
check_var "POSTGRES_PASSWORD"
check_var "S3_SECRET_ACCESS_KEY"

AUTH_SECRET=$(grep -E "^AUTH_SECRET=" "$ENV_FILE" | head -n 1 | cut -d'=' -f2- | tr -d '\r"' || true)
if [ "${#AUTH_SECRET}" -lt 32 ]; then
  echo "  [FALHA] AUTH_SECRET deve ter pelo menos 32 caracteres (atual: ${#AUTH_SECRET}). Gere com: openssl rand -hex 32"
  ERRORS=$((ERRORS + 1))
else
  echo "  [OK] AUTH_SECRET possui tamanho seguro (${#AUTH_SECRET} caracteres)."
fi

echo "2. Validando URLs e domínios..."
check_var "WEB_ORIGIN"
check_var "CORS_ORIGINS"
check_var "NEXT_PUBLIC_API_URL"
check_var "S3_PUBLIC_BASE_URL"

WEB_ORIGIN=$(grep -E "^WEB_ORIGIN=" "$ENV_FILE" | head -n 1 | cut -d'=' -f2- | tr -d '\r"' || true)
if [[ "$WEB_ORIGIN" != https://* ]] && [[ "$WEB_ORIGIN" != http://localhost* ]]; then
  echo "  [AVISO] WEB_ORIGIN deveria usar HTTPS em produção: '$WEB_ORIGIN'"
fi

COOKIE_DOMAIN=$(grep -E "^COOKIE_DOMAIN=" "$ENV_FILE" | head -n 1 | cut -d'=' -f2- | tr -d '\r"' || true)
if [ -n "$COOKIE_DOMAIN" ] && [[ "$COOKIE_DOMAIN" != .* ]]; then
  echo "  [FALHA] COOKIE_DOMAIN deve começar com um ponto (ex: .seudominio.com). Valor atual: '$COOKIE_DOMAIN'"
  ERRORS=$((ERRORS + 1))
elif [ -n "$COOKIE_DOMAIN" ]; then
  echo "  [OK] COOKIE_DOMAIN configurado com ponto inicial: $COOKIE_DOMAIN"
fi

echo "3. Validando flags de produção..."
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
  check_var "RESEND_API_KEY"
  check_var "MAIL_FROM"
fi

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "❌ Verificação concluída com $ERRORS erro(s). Corrija o $ENV_FILE antes do deploy."
  exit 1
else
  echo "✅ Verificação concluída com sucesso! $ENV_FILE está pronto para deploy."
fi
