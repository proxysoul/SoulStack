#!/bin/sh
set -eu
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"
fail=0
err=$(mktemp)
check() {
  label=$1
  shift
  if "$@" >/dev/null 2>"$err"; then echo "ok    $label"; else echo "FAIL  $label"; cat "$err"; fail=1; fi
}
for f in scripts/*.sh immune/*.sh; do check "sh -n $f" sh -n "$f"; done
for f in immune/app/*.mjs immune/app/*.js immune/app/demo/*.mjs skills/immune-system/app/*.mjs skills/immune-system/app/*.js; do
  if [ -f "$f" ]; then check "node --check $f" node --check "$f"; fi
done
check "copilot rules match guides/takeaways.md" cmp guides/takeaways.md com.github.copilot/rules/soulstack.instructions.md
for f in plugin.json .github/plugin/marketplace.json immune/app/immune.config.json; do
  check "valid JSON $f" node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$f"
done
check "marketplace.json carries plugin.json version" node -e "const v=require('./plugin.json').version;if(!JSON.stringify(require('./.github/plugin/marketplace.json')).includes(JSON.stringify(v)))process.exit(1)"
if command -v pwsh >/dev/null 2>&1; then
  for f in scripts/*.ps1 immune/*.ps1; do
    check "PowerShell parse $f" pwsh -NoProfile -Command "\$e=\$null; [void][System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path '$f'), [ref]\$null, [ref]\$e); if (\$e) { \$e | ForEach-Object { Write-Error \$_.Message }; exit 1 }"
  done
else
  echo "skip  PowerShell parse (pwsh not installed)"
fi
rm -f "$err"
exit $fail
