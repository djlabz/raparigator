#!/usr/bin/env bash
set -euo pipefail

REQUIRED_CHECKS=(
  "Lint, format e typecheck"
  "Testes do domain"
  "Testes do web (Vitest)"
  "Testes da API (Postgres)"
  "Build da imagem da API"
  "API sobe com o env de produção do compose"
  "Build da imagem do Web"
  "E2E (suite)"
  "E2E (simulador-desligado)"
  "E2E (checkout-ligado)"
)
WAIT_LIMIT_SECONDS=${WAIT_LIMIT_SECONDS:-2400}
POLL_SECONDS=30

usage() {
  echo "uso: scripts/merge-pr.sh <numero-do-pr> [--squash]" >&2
  exit 2
}

[ $# -ge 1 ] || usage
pr=$1
method=--rebase
if [ "${2:-}" = "--squash" ]; then
  method=--squash
elif [ -n "${2:-}" ]; then
  usage
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required_json=$(printf '%s\n' "${REQUIRED_CHECKS[@]}" | jq -R . | jq -s .)

check_report() {
  jq -r --argjson required "$required_json" '
    (.statusCheckRollup
      | map(select(.name != null))
      | group_by(.name)
      | map(max_by(.startedAt // ""))
      | map({key: .name, value: .})
      | from_entries) as $latest
    | $required[]
    | . as $name
    | ($latest[$name]) as $c
    | if $c == null then "ausente\t\($name)"
      elif $c.status != "COMPLETED" then "pendente\t\($name)"
      elif $c.conclusion == "SUCCESS" then "ok\t\($name)"
      else "falhou(\($c.conclusion))\t\($name)"
      end'
}

view=$(gh pr view "$pr" --json state,baseRefName,headRefOid,isDraft)
state=$(jq -r .state <<<"$view")
base=$(jq -r .baseRefName <<<"$view")
sha=$(jq -r .headRefOid <<<"$view")
[ "$state" = "OPEN" ] || { echo "PR #$pr não está aberto ($state)"; exit 1; }
[ "$base" = "main" ] || { echo "PR #$pr não aponta para a main ($base)"; exit 1; }
[ "$(jq -r .isDraft <<<"$view")" = "false" ] || { echo "PR #$pr é rascunho"; exit 1; }

echo "PR #$pr em $sha; esperando ${#REQUIRED_CHECKS[@]} checks obrigatórios"
start=$(date +%s)
while true; do
  current=$(gh pr view "$pr" --json headRefOid,statusCheckRollup)
  if [ "$(jq -r .headRefOid <<<"$current")" != "$sha" ]; then
    echo "a branch do PR mudou durante a espera; rode de novo"
    exit 1
  fi
  report=$(check_report <<<"$current")
  if grep -q '^falhou' <<<"$report"; then
    echo "$report"
    echo "CI vermelha no PR #$pr; sem merge"
    exit 1
  fi
  if ! grep -qv '^ok' <<<"$report"; then
    echo "$report"
    break
  fi
  if [ $(($(date +%s) - start)) -ge "$WAIT_LIMIT_SECONDS" ]; then
    echo "$report"
    echo "checks não concluíram em ${WAIT_LIMIT_SECONDS}s (estouro conta como falha); sem merge"
    exit 1
  fi
  sleep "$POLL_SECONDS"
done

merge_state=$(gh pr view "$pr" --json mergeStateStatus -q .mergeStateStatus)
if [ "$merge_state" != "CLEAN" ]; then
  echo "estado de merge $merge_state (esperado CLEAN; BEHIND = atualize a branch com a main); sem merge"
  exit 1
fi

gh pr merge "$pr" "$method" --delete-branch --match-head-commit "$sha"
echo "PR #$pr: $(gh pr view "$pr" --json state -q .state)"

git fetch -q --prune origin
main_sha=$(git rev-parse origin/main)
echo "main em $main_sha; esperando a CI do push"
start=$(date +%s)
while true; do
  runs=$(gh run list --commit "$main_sha" --event push --json databaseId,workflowName,status,conclusion)
  total=$(jq length <<<"$runs")
  done_count=$(jq '[.[] | select(.status == "completed")] | length' <<<"$runs")
  if [ "$total" -ge 2 ] && [ "$total" = "$done_count" ]; then
    jq -r '.[] | "\(.conclusion)\t\(.workflowName)\t\(.databaseId)"' <<<"$runs"
    if jq -e 'all(.conclusion == "success")' <<<"$runs" >/dev/null; then
      echo "CI da main verde"
      exit 0
    fi
    echo "CI da main VERMELHA depois do merge do PR #$pr"
    exit 1
  fi
  if [ $(($(date +%s) - start)) -ge "$WAIT_LIMIT_SECONDS" ]; then
    jq -r '.[] | "\(.status)\t\(.conclusion)\t\(.workflowName)"' <<<"$runs"
    echo "CI da main não concluiu em ${WAIT_LIMIT_SECONDS}s"
    exit 1
  fi
  sleep "$POLL_SECONDS"
done
