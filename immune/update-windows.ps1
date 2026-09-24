$ErrorActionPreference = "Continue"
function Fail($m) { Write-Host "FAIL: $m"; exit 1 }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Fail "no git on this machine" }
$base = (Join-Path $env:USERPROFILE "ssu-") + (Get-Date -Format "HHmmss")
New-Item -ItemType Directory $base | Out-Null
tar -xzf (Join-Path $env:USERPROFILE "ss.tgz") -C $base
Set-Location $base
$env:GIT_AUTHOR_NAME = "t"; $env:GIT_AUTHOR_EMAIL = "t@t"; $env:GIT_COMMITTER_NAME = "t"; $env:GIT_COMMITTER_EMAIL = "t@t"
Rename-Item SoulStack src; Copy-Item src\scripts\setup.ps1 setup.ps1
Push-Location src; git init -q -b main; git add .; git commit -qm "feat: first"; Pop-Location
git clone -q --bare src remote.git
$env:SOULSTACK_HOME = "$base\home"; $env:SOULSTACK_REPO = "$base\remote.git"; $env:SOULSTACK_DIR = "$base\home\dev\SoulStack"; $env:SOULSTACK_BIN = "$base\bin"
New-Item -ItemType Directory "$base\home" | Out-Null
$ps = "powershell"
function Setup([string[]]$a) { (& $ps -NoProfile -ExecutionPolicy Bypass -File "$base\setup.ps1" @a | Out-String) }
function Soul([string[]]$a) { (& cmd /c "$base\bin\soulstack.cmd" @a | Out-String) }
$o = Setup @(); Write-Host $o
if ($o -notmatch "stack\s+created") { Fail "clone" }
if (-not (Test-Path "$base\bin\soulstack.cmd")) { Fail "command" }
$o = Soul @("check"); if ($o -notmatch "stack\s+same") { Write-Host $o; Fail "same" }
Push-Location src
(Get-Content plugin.json -Raw).Replace('"version": "1.1.0"', '"version": "9.9.9"') | Set-Content -NoNewline plugin.json
git commit -qam "feat(guides): add a new rule"; git push -q ..\remote.git main; Pop-Location
$o = Soul @("check"); Write-Host $o; if ($o -notmatch "v9.9.9 is out") { Fail "check" }
$o = Soul @("update"); Write-Host $o
if ($o -notmatch "v1.1.0 to v9.9.9") { Fail "update line" }
if ($o -notmatch "new\s+feat\(guides\): add a new rule") { Fail "news" }
Push-Location src; git commit -q --amend -m "feat: rewritten"; git push -qf ..\remote.git main; Pop-Location
$o = Soul @("update"); if ($o -notmatch "stack\s+updated") { Write-Host $o; Fail "rewrite" }
if (-not (git -C $env:SOULSTACK_DIR branch | Select-String backup-)) { Fail "backup branch" }
$o = Soul @("remove"); if (Test-Path "$base\bin\soulstack.cmd") { Fail "command not removed" }
Write-Host "ALL OK"
