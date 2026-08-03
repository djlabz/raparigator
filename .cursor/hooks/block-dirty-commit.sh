#!/usr/bin/env bash
set -euo pipefail

input="$(cat)"

command="$(
  printf '%s' "$input" | node -e '
    let raw = "";
    process.stdin.on("data", (chunk) => {
      raw += chunk;
    });
    process.stdin.on("end", () => {
      try {
        const parsed = JSON.parse(raw);
        process.stdout.write(typeof parsed.command === "string" ? parsed.command : "");
      } catch {
        process.stdout.write("");
      }
    });
  '
)"

is_git_commit="$(
  printf '%s' "$command" | node -e '
    let raw = "";
    process.stdin.on("data", (chunk) => {
      raw += chunk;
    });
    process.stdin.on("end", () => {
      const normalized = raw.replace(/\r/g, "");
      const isCommit =
        /(^|[;&|\n]|&&|\|\|)\s*(?:sudo\s+)?git(?:\s+[^\s;|&\n]+)*\s+commit(?:\s|$)/m.test(normalized) &&
        !/\bgit(?:\s+[^\s;|&\n]+)*\s+commit\s+--help\b/m.test(normalized) &&
        !/\bcommit-(?:tree|graph|msg)\b/m.test(normalized);
      process.stdout.write(isCommit ? "yes" : "no");
    });
  '
)"

if [[ "$is_git_commit" != "yes" ]]; then
  printf '%s\n' '{"permission":"allow"}'
  exit 0
fi

log_file="$(mktemp)"
trap 'rm -f "$log_file"' EXIT

set +e
bash .cursor/hooks/pre-commit-check.sh >"$log_file" 2>&1
check_status=$?
set -e

if [[ "$check_status" -eq 0 ]]; then
  printf '%s\n' '{"permission":"allow"}'
  exit 0
fi

summary="$(
  node -e '
    const fs = require("fs");
    const logPath = process.argv[1];
    const log = fs.readFileSync(logPath, "utf8").trim();
    const lines = log.split(/\r?\n/).filter(Boolean);
    const tail = lines.slice(-40).join("\n");
    const message = [
      "Commit bloqueado pelo hook do Cursor.",
      "",
      tail,
    ].join("\n");
    process.stdout.write(JSON.stringify({
      permission: "deny",
      user_message: message,
      agent_message: message,
    }));
  ' "$log_file"
)"

printf '%s\n' "$summary"
exit 0
