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
$h2 = Join-Path $base "home2"
foreach ($d in ".claude", ".config\opencode", ".pi", "cx", "cc", ".gemini") { New-Item -ItemType Directory (Join-Path $h2 $d) -Force | Out-Null }
[IO.File]::WriteAllText((Join-Path $h2 "cx\config.toml"), "x")
[IO.File]::WriteAllText((Join-Path $h2 "cx\AGENTS.override.md"), "mine")
[IO.File]::WriteAllText((Join-Path $h2 "cc\settings.json"), "{}")
[IO.File]::WriteAllText((Join-Path $h2 ".gemini\settings.json"), "{}")
$h = $h2; $env:CODEX_HOME = Join-Path $h2 "cx"; $env:CLAUDE_CONFIG_DIR = Join-Path $h2 "cc"
$out = (Run @("-Plain")) -join "`n"
Remove-Item Env:CODEX_HOME, Env:CLAUDE_CONFIG_DIR
if (-not (Select-String -Quiet "soulstack:start" (Join-Path $h2 "cx\AGENTS.md"))) { Fail "CODEX_HOME ignored" }
if (-not (Select-String -Quiet "soulstack:start" (Join-Path $h2 "cc\CLAUDE.md"))) { Fail "CLAUDE_CONFIG_DIR ignored" }
if (-not (Test-Path (Join-Path $h2 "cc\skills\ensoul\SKILL.md"))) { Fail "claude skills outside CLAUDE_CONFIG_DIR" }
if (-not (Select-String -Quiet "soulstack:start" (Join-Path $h2 ".gemini\GEMINI.md"))) { Fail "gemini rules" }
if ($out -notmatch "rules\s+hidden\s+Codex") { Fail "AGENTS.override.md not reported" }
foreach ($p in ".claude\CLAUDE.md", ".config\opencode\AGENTS.md", ".pi\agent") { if (Test-Path (Join-Path $h2 $p)) { Fail "bare folder counted as an agent: $p" } }
$h = Join-Path $base "home3"
New-Item -ItemType Directory (Join-Path $h ".empryo") -Force | Out-Null
[IO.File]::WriteAllText((Join-Path $h ".empryo\config.json"), '{"presets":["~/../SoulStack/plugins/presets/proxysoul.json"]}')
$out = (Run @("-Plain", "-Presets", "proxysoul")) -join "`n"
if ($out -notmatch "preset\s+same\s+proxysoul") { Fail "preset added twice" }
Write-Host "ALL OK"
