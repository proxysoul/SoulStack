$ErrorActionPreference = "Stop"
$base = (Join-Path $env:USERPROFILE "sst-") + (Get-Date -Format "HHmmss")
New-Item -ItemType Directory $base | Out-Null
tar -xzf (Join-Path $env:USERPROFILE "ss.tgz") -C $base
$repo = Join-Path $base "SoulStack"
Write-Host "### $([Environment]::OSVersion.VersionString) PS $($PSVersionTable.PSVersion)"
function Fail($m) { Write-Host "FAIL: $m"; exit 1 }
$h = Join-Path $base "home"
$files = ".claude\CLAUDE.md", ".codex\AGENTS.md", ".copilot\copilot-instructions.md"
foreach ($f in $files) { New-Item -ItemType Directory (Split-Path (Join-Path $h $f)) -Force | Out-Null; [IO.File]::WriteAllText((Join-Path $h $f), "mine`n") }
function Run([string[]]$a) { $env:SOULSTACK_HOME = $h; & powershell -NoProfile -ExecutionPolicy Bypass -File "$repo\scripts\setup.ps1" @a; if ($LASTEXITCODE -ne 0) { Fail "exit $LASTEXITCODE" } }
Run @(); Run @()
foreach ($f in $files) {
  $p = Join-Path $h $f; $t = [IO.File]::ReadAllText($p)
  if (-not $t.StartsWith("mine")) { Fail "$f overwritten" }
  if (([regex]::Matches($t, "soulstack:start")).Count -ne 1) { Fail "$f block count" }
  if (-not (Get-ChildItem "$p.bak-*")) { Fail "$f no backup" }
}
if (@(Get-ChildItem "$h\.claude\agents" -Filter *.md).Count -ne @(Get-ChildItem "$repo\agents" -Filter *.md).Count) { Fail "claude agents not linked" }
Run @("-Remove")
if (@(Get-ChildItem "$h\.claude\agents" -Filter *.md -ErrorAction SilentlyContinue).Count -ne 0) { Fail "claude agents not removed" }
foreach ($f in $files) { $t = [IO.File]::ReadAllText((Join-Path $h $f)); if ($t -match "soulstack") { Fail "$f not removed" } }
Write-Host "ALL OK"
