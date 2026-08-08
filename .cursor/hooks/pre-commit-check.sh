#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root_dir"

if [[ -n "${CURSOR_AGENT:-}" ]]; then
  echo "pre-commit: commit pelo agente Cursor bloqueado."
  echo "Faça o commit manualmente (terminal/Git UI fora do agente)."
  echo
  echo "Se quiser liberar commit do agente no futuro:"
  echo "1. Remova/comente este bloqueio por CURSOR_AGENT"
  echo "2. Ajuste .cursor/hooks/block-dirty-commit.sh (deny absoluto -> quality gate)"
  exit 1
fi

echo "pre-commit: rodando npm run check (eslint + typecheck)..."
if ! npm run check; then
  echo
  echo "pre-commit: commit bloqueado. Corrija eslint/typecheck e tente de novo."
  echo "Comando: npm run check"
  exit 1
fi
echo "pre-commit: ok"
exit 0
