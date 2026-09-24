#!/bin/sh
set -eu
root=$(cd "$(dirname "$0")/.." && pwd)
images="${IMMUNE_IMAGES:-alpine:latest debian:stable-slim}"
out="$root/immune/results"
mkdir -p "$out"
runtime=""
for c in container docker podman; do
  if command -v "$c" >/dev/null 2>&1; then runtime=$c; break; fi
done
commit=$(git -C "$root" rev-parse --short HEAD 2>/dev/null || echo unknown)
dirty=$(git -C "$root" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
json="$out/latest.json"
started=$(date -u +%Y-%m-%dT%H:%M:%SZ)
rows=""
add() {
  esc=$(printf '%s' "$5" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr -d '\n\r')
  rows="$rows${rows:+,}{\"platform\":\"$1\",\"target\":\"$2\",\"check\":\"$3\",\"status\":\"$4\",\"detail\":\"$esc\",\"ms\":$6}"
}
fail=0
if sh -n "$root/scripts/setup.sh"; then add macos local syntax pass "sh -n scripts/setup.sh" 0; else add macos local syntax fail "sh -n failed" 0; fail=1; fi
if [ -z "$runtime" ]; then
  add linux none setup-linux hole "no container runtime (container, docker or podman)" 0
else
  for image in $images; do
    for t in setup-linux update-linux; do
      s=$(date +%s)
      line=$($runtime run --rm -v "$root:/src" -v "$root/immune/$t.sh:/t.sh" "$image" sh /t.sh 2>&1 | tail -1)
      ms=$(( ($(date +%s) - s) * 1000 ))
      printf '%-20s %-14s %s\n' "$image" "$t" "$line"
      case "$line" in "ALL OK") add linux "$image" "$t" pass "$line" "$ms" ;; *) add linux "$image" "$t" fail "$line" "$ms"; fail=1 ;; esac
    done
  done
fi
s=$(date +%s)
if command -v gitleaks >/dev/null 2>&1; then
  if gitleaks dir "$root" --no-banner --redact >/dev/null 2>&1; then add security gitleaks secrets pass "gitleaks: no secrets in the working tree" 0; else add security gitleaks secrets fail "gitleaks found possible secrets; run gitleaks dir . --redact" 0; fail=1; fi
else
  hits=$(git -C "$root" ls-files -z | xargs -0 grep -I -l -E 'AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,}|sk-[A-Za-z0-9_-]{32,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35}|-----BEGIN [A-Z ]*PRIVATE KEY-----' 2>/dev/null | tr '\n' ' ')
  if [ -z "$hits" ]; then add security patterns secrets pass "no token or private-key patterns in tracked files (install gitleaks for a deeper scan)" $(( ($(date +%s) - s) * 1000 )); else add security patterns secrets fail "possible secrets in: $hits" 0; fail=1; fi
fi
if grep -n -E 'http://[^l1]' "$root/scripts/setup.sh" "$root/scripts/setup.ps1" >/dev/null 2>&1; then add security scripts downloads fail "plain http URL in a setup script" 0; fail=1; else add security scripts downloads pass "setup scripts only use https" 0; fi
if command -v bun >/dev/null 2>&1 && [ -f "$root/site/bun.lock" ]; then
  s=$(date +%s)
  audit=$(cd "$root/site" && bun audit 2>&1 | tail -1)
  case "$audit" in *"No vulnerabilities"*) add security bun-audit site-deps pass "$audit" $(( ($(date +%s) - s) * 1000 )) ;; *) add security bun-audit site-deps fail "$audit" 0; fail=1 ;; esac
fi
add windows ssh setup-windows hole "run immune/setup-windows.ps1 and immune/update-windows.ps1 on a Windows host (see immune/README.md)" 0
printf '{"commit":"%s","dirty":%s,"started":"%s","finished":"%s","runtime":"%s","results":[%s]}\n' "$commit" "$dirty" "$started" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${runtime:-none}" "$rows" > "$json"
cp "$json" "$out/$(date -u +%Y%m%dT%H%M%SZ).json"
echo "windows: coverage hole unless run on a Windows host (see immune/README.md)"
if command -v node >/dev/null 2>&1; then (cd "$root" && node immune/app/server.mjs immune/app/immune.config.json --export site/public/immunity >/dev/null); fi
echo "dashboard: bun run immune:app, then open http://127.0.0.1:4177"
exit "$fail"
