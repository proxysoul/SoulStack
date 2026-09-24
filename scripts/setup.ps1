[CmdletBinding()]
param(
  [switch]$Check,
  [switch]$Remove,
  [string]$Presets = "",
  [string]$Skills = "",
  [string]$Config = "",
  [switch]$Plain,
  [switch]$Yes
)

$ErrorActionPreference = "Stop"
$UserHome = if ($env:SOULSTACK_HOME) { $env:SOULSTACK_HOME } else { $HOME }
if (-not $Skills) { $Skills = Join-Path $UserHome ".agents\skills" }
if (-not $Config) { $Config = Join-Path $UserHome ".empryo\config.json" }
$mode = if ($Remove) { "remove" } elseif ($Check) { "check" } else { "install" }
$repoUrl = if ($env:SOULSTACK_REPO) { $env:SOULSTACK_REPO } else { "https://github.com/proxysoul/SoulStack.git" }
$homeDir = if ($env:SOULSTACK_DIR) { $env:SOULSTACK_DIR } else { Join-Path $UserHome "dev\SoulStack" }
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$script:backedUp = $false

$vt = $false
try { $vt = [bool]$Host.UI.SupportsVirtualTerminal } catch { $vt = $false }
$fancy = (-not $Plain) -and $vt -and (-not [Console]::IsOutputRedirected) -and (-not $env:NO_COLOR)

$e = [char]27
if ($fancy) {
  [Console]::OutputEncoding = [Text.Encoding]::UTF8
  if ($env:WT_SESSION -or $env:COLORTERM -match "truecolor|24bit") {
    $C = @{ fg = "$e[38;2;232;235;238m"; dim = "$e[38;2;110;120;133m"; acc = "$e[38;2;152;176;194m"; eye = "$e[38;2;196;154;164m"; ok = "$e[38;2;147;179;162m"; warn = "$e[38;2;207;181;149m" }
  } else {
    $C = @{ fg = "$e[97m"; dim = "$e[90m"; acc = "$e[36m"; eye = "$e[35m"; ok = "$e[32m"; warn = "$e[33m" }
  }
  $C.bold = "$e[1m"; $C.off = "$e[0m"
} else {
  $C = @{ fg = ""; dim = ""; acc = ""; eye = ""; ok = ""; warn = ""; bold = ""; off = "" }
}

function Out-Line([string]$Text) { [Console]::Out.WriteLine($Text) }

function Tilde([string]$Path) {
  if ($Path.StartsWith($UserHome, [StringComparison]::OrdinalIgnoreCase)) { return "~" + $Path.Substring($UserHome.Length) }
  return $Path
}

function Paint([string]$Word, [string]$Text) {
  $color = switch -Regex ($Word) {
    '^(added|linked|created)$' { $C.ok }
    '^(updated|copied|removed)$' { $C.acc }
    '^(missing|skipped|outdated)$' { $C.warn }
    default { $C.dim }
  }
  return "$color$Text$($C.off)"
}

$script:Results = New-Object System.Collections.Generic.List[object]
$script:lastName = $null

function Item([string]$Name, [string]$Rest) {
  $script:lastName = $Name
  return ("{0,-12} {1}" -f $Name, $Rest)
}

function Row([string]$Label, [string]$Word, [string]$Detail) {
  if ($Detail -like "*(backed up)*") { $script:backedUp = $true }
  $name = if ($script:lastName) { $script:lastName } else { $Detail }
  $script:lastName = $null
  $script:Results.Add([pscustomobject]@{ Label = $Label; Word = $Word; Name = $name })
  if ($fancy) { return }
  if (-not $Word) { Out-Line ("  {0,-7} {1}" -f $Label, $Detail); return }
  Out-Line ("  {0,-7} {1,-8} {2}" -f $Label, $Word, $Detail)
}

$frameData = @(
  "ICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIAogICAgICAg",
  "ICAgICAgICAgCiAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAg",
  "ICAKICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIAogICAg",
  "ICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIAogICAgICAge+KioOKhvuKgm+Kiv+Khhn0gICAg",
  "CiAgICAgICB74qCI4qC/4qO24qC+4qCDfSAgICAKICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgCiAgICAgICAgICAg",
  "ICAgICAKICAgICAgICAgICAgICAgIAogICAg4qKA4qCU4qCa4qCJ4qCZ4qOS4qGmICAgICAKICAg4qKg4qCBICB74qKg4qO/4qC7",
  "4qK/4qOOfeKhhCAgIAogICDioqAgICB74qCY4qC/4qO24qG/4qCDfeKhhiAgIAogICDioJjio4YgICAgICDio6DioIMgICAKICAg",
  "IOKgiOKgk+KgpuKgpOKgtuKgkuKgiuKggSAgICAKICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgCiAgICDio6DioJbi",
  "oJvioJvioJvio5viobbio4QgICAgCiAgIOKjvOKggSAge+KisOKjv+Kgu+Kjv+Kjr33io6cgICAKICAg4qO/ICAge+KgmOKiv+Kj",
  "tuKhv+Kgi33io78gICAKICAg4qC44qOnICAgICAg4qOw4qCPICAgCiAgICDioIjioLvioLbioLbiorbioLbioJvioIkgICAgCiAg",
  "ICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIAogICAg4qOg4qC24qCb4qCb4qKb4qOb4qG24qOEICAgIAogICDio7zioIEg",
  "IHviorDio7/ioLvio7/io6994qO3ICAgCiAgIOKjvyAgIHvioJjior/io7biob/ioI994qO/ICAgCiAgIOKgueKjpyAgICAgIOKj",
  "sOKhjyAgIAogICAg4qCZ4qC74qC24qC24qK24qC24qCf4qCLICAgIAogICAgICAgICAgICAgICAgCiAgICAg4qGEIOKigOKhhCAg",
  "4qGAICAgIAogICDioqLio7TioJ7ioJvioJviopvio5viob7io6bioYAgICAKICAg4qO+4qCBICB74qKw4qO/4qC74qO/4qO/feKj",
  "v+KggSAgCiAg4qCY4qO/ICAge+KgmOKiv+KjtuKhv+Kgj33io7/ioIIgIAogICDior3io6fioYAgICAgIOKjsOKhnyAgIAogICAg",
  "4qCZ4qK/4qK24qG24qK24qC24qCf4qCL4qCCICAgCiAgICAg4qCBICDioIggICAgICAgCiAgICAg4qOE4qKA4qOA4qOGICDioYAg",
  "ICAgCiAgIOKiouKjtOKgn+Kgm+Kgm+Kim+Kju+Kjv+KjpuKhgCAgIAogIOKigOKjv+KggSAge+KisOKjv+Kgu+Kiv+Kjr33io7/i",
  "oIkgIAog4qCI4qCZ4qO/ICAge+KgmOKiv+KjtuKhv+Kgj33io7/ioJPioIQgCiAg4qKg4qK/4qOnICAgICAg4qOw4qGfICAgCiAg",
  "ICDioJnior/io7bio7biorbioLbioJ/ioIvioIIgICAKICAgICDioIEgIOKgmCAgICAgICAKICAgICDio4Tio4Dio4Dio4Yg4qKA",
  "4qGAICAgIAogICDiorLio7TioJ/ioJvioJviopvio7vio7/io6bio4QgICAKICDiooDio7/ioIEgIHviorDio7/ioLvior/io699",
  "4qO/4qCJICAKIOKgiOKgm+KjvyAgIHvioJjior/io7biob/ioI994qO/4qCz4qCEIAogIOKioOKiv+KjhyAgICAgIOKjsOKhnyAg",
  "IAogICAg4qCZ4qO34qO24qO24qK24qC24qCf4qCL4qCCICAgCiAgICAg4qCBICDioJggICAgICAgCiAgICAg4qOE4qOA4qOg4qOG",
  "4qGA4qKA4qGAICAgIAogICDiorLio7TioJ/ioJvioJviopvio7vio7/io7bio4QgICAKICDiooDio7/ioIEgIHviorDio7/ioLvi",
  "or/io6994qO/4qGJICAKIOKgiOKgm+KjvyAgIHvioJjior/io7biob/ioI994qO/4qCz4qCEIAogIOKioOKiv+KjhyAgICAgIOKj",
  "sOKhnyAgIAogICAg4qCZ4qO/4qO24qO24qK24qC24qCf4qCL4qCCICAgCiAgICAg4qCBICDioJggICAgICAgCiAgICAg4qOE4qOA",
  "4qOg4qOG4qGA4qKA4qGAICAgIAogICDiorLio7TioJ/ioJvioJviopvio7vio7/io7bio4QgICAKICDiooDio7/ioIEgIHviorDi",
  "o7/ioLvior/io6994qO/4qGJICAKIOKgiOKgm+KjvyAgIHvioJjior/io7biob/ioI994qO/4qCz4qCEIAogIOKioOKiv+KjhyAg",
  "ICAgIOKjsOKhnyAgIAogICAg4qCZ4qO/4qO24qO24qK24qC24qCf4qCL4qCCICAgCiAgICAg4qCBICDioJggICAgICAgCiAgICAg",
  "4qOE4qOA4qOg4qOGIOKigOKhgCAgICAKICAg4qKy4qO04qCf4qCb4qCb4qKb4qO74qO/4qO24qOEICAgCiAg4qKA4qO/4qCBICB7",
  "4qKw4qO/4qC74qK/4qOvfeKjv+KhiSAgCiDioIjioJvio78gICB74qCY4qK/4qO24qG/4qCPfeKjv+Kgs+KghCAKICDioqDior/i",
  "o4cgICAgICDio7DioZ8gICAKICAgIOKgmeKjt+KjtuKjtuKituKgtuKgn+Kgi+KggiAgIAogICAgIOKggSAg4qCYICAgICAgIAog",
  "ICAgIOKjhOKigOKjgOKjhiDiooDioYAgICAgCiAgIOKisuKjtOKgn+Kgm+Kgm+Kim+Kju+Kjv+KjpuKhhCAgIAogIOKigOKjv+Kg",
  "gSAge+KisOKjv+Kgu+Kiv+Kjr33io7/ioYkgIAog4qCI4qC74qO/ICAge+KgmOKiv+KjtuKhv+Kgj33io7/ioLPioIQgCiAg4qKg",
  "4qK/4qOHICAgICAg4qOw4qGfICAgCiAgICDioJnio7fio7bio7biorbioLbioJ/ioIvioIIgICAKICAgICDioIEgIOKgmCAgICAg",
  "ICAKICAgICDio4TiooDio4Dio4Yg4qKA4qGAICAgIAogICDiorLio7TioJ/ioJvioJviopvio5viob/io6bioYAgICAKICDiooDi",
  "o7/ioIEgIHviorDio7/ioLvior/io6994qO/4qGJICAKIOKgiOKgu+KjvyAgIHvioJjior/io7biob/ioI994qO/4qCz4qCEIAog",
  "IOKioOKiveKjhyAgICAgIOKjoOKhnyAgIAogICAg4qCZ4qK34qO24qO04qK24qC24qCe4qCL4qCGICAgCiAgICAg4qCBICDioJgg",
  "ICAgICAgCiAgICAg4qOE4qKA4qOA4qOGIOKigOKhgCAgICAKICAg4qKy4qO04qC/4qCb4qCb4qKb4qO74qO/4qOm4qGAICAgCiAg",
  "4qKA4qO/4qCBICB74qKw4qO/4qC74qK/4qOvfeKjv+KhiSAgCiDioIjioLvio78gICB74qCY4qK/4qO24qO/4qCPfeKjv+Kgt+Kg",
  "hCAKICDioqDior/io4cgICAgICDio6DioZ8gICAKICAgIOKgmeKit+KjpuKjtOKjtuKhtuKgvuKgm+KghiAgIAogICAgIOKgiSAg",
  "4qCYICAgICAgIAogICAgIOKjhOKigOKjgOKhhiDiooDioYAgICAgCiAgIOKisuKjtOKgv+Kgm+Kgm+Kim+Kju+Kjv+KjpuKhgCAg",
  "IAogIOKigOKjvuKggSAge+KisOKjv+Kgv+Kjv+Kjr33io7/ioIkgIAog4qCI4qC74qO/ICAge+KgmOKiv+KjtuKjvuKgj33io7/i",
  "oLfioIQgCiAg4qKA4qO/4qOHICAgICAg4qOg4qGfICAgCiAgICDioJniorfio6bio7Tio7biobbioL7ioJvioIYgICAKICAgICDi",
  "oIkgIOKgmCAgICAgICAKICAgICDio4TiooDio4Dio4Yg4qKA4qGAICAgIAogICDiorLio7TioJ/ioJvioJviopvio5viob/io6bi",
  "oYQgICAKICDiooDio7/ioIEgIOKisOKiq+KioOKijOKiq+Kjv+KhiSAgCiDioIjioLvio78gICDioJjioq7io4HioaHioI/io7/i",
  "oLPioIQgCiAg4qKg4qK/4qOHICAgICAg4qOw4qGfICAgCiAgICDioJniorfio7bio7TiorbioLbioJ/ioIvioIIgICAKICAgICDi",
  "oIEgIOKgmCAgICAgICAKICAgICDio4Tio4Dio6Dio4bioYDiooDioYAgICAgCiAgIOKisuKjtOKgn+Kgm+Kgm+Kim+Kju+Khv+Kj",
  "tuKjhCAgIAogIOKigOKjv+KggSAg4qKw4qKB4qKg4qKM4qKr4qO/4qGJICAKIOKgiOKgm+KjvyAgIOKgmOKihOKjgeKhoeKgjuKj",
  "v+Kgs+KghCAKICDioqDior/io4cgICAgICDio7DioZ8gICAKICAgIOKgmeKjv+KjtuKjtuKituKgtuKgn+Kgi+KggiAgIAogICAg",
  "IOKggSAg4qCYICAgICAgIAogICAgIOKjhOKigOKjgOKjhiDiooDioYAgICAgCiAgIOKisuKjtOKgn+Kgm+Kgm+Kim+Kjm+Khv+Kj",
  "puKjhCAgIAogIOKigOKjv+KggSAg4qKw4qKB4qKg4qKM4qKr4qO/4qGJICAKIOKgiOKgu+KjvyAgIOKgmOKihOKjgeKhoeKgjuKj",
  "v+Kgs+KghCAKICDioqDior/io4cgICAgICDio7DioZ8gICAKICAgIOKgmeKjt+KjtuKjtuKituKgtuKgn+Kgi+KggiAgIAogICAg",
  "IOKggSAg4qCYICAgICAgIAogICAgIOKjhOKigOKjgOKjhiDiooDioYAgICAgCiAgIOKisuKjtOKgn+Kgm+Kgm+Kim+Kjm+Khv+Kj",
  "puKhgCAgIAogIOKigOKjv+KggSAge+KisOKjv+Kgu+Kiv+Kjr33io7/ioYkgIAog4qCI4qC74qO/ICAge+KgmOKiv+KjtuKhv+Kg",
  "j33io7/ioLPioIQgCiAg4qKg4qK94qOHICAgICAg4qOg4qGfICAgCiAgICDioJniorfio7bio7TiorbioLbioJ7ioIvioIYgICAK",
  "ICAgICDioIEgIOKgmCAgICAgICAK"
) -join ""
$frameLines = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($frameData)).Split([char]10)

function Get-Bar([int]$Done, [int]$Total) {
  $width = 22
  $fill = [int][math]::Floor($Done * $width / $Total)
  $pct = [int][math]::Floor($Done * 100 / $Total)
  return "$($C.acc)$(([string][char]0x2501) * $fill)$($C.dim)$(([string][char]0x2500) * ($width - $fill))$($C.off) " + ("{0,3}%" -f $pct)
}

function Draw-Frame([int]$Index, [string]$Label) {
  $times = [char]0x00D7
  for ($r = 0; $r -lt 7; $r++) {
    $line = $frameLines[($Index - 1) * 7 + $r].Replace("{", $C.eye).Replace("}", $C.acc)
    $right = switch ($r) {
      1 { "$($C.bold)$($C.fg)SoulStack$($C.off)" }
      2 { "$($C.dim)Empryo $times ProxySoul$($C.off)" }
      4 { Get-Bar $Index 20 }
      5 { "$($C.dim)$Label$($C.off)" }
      default { "" }
    }
    Out-Line "$e[2K  $($C.acc)$line$($C.off)    $right"
  }
}

function Show-Summary {
  foreach ($r in $script:Results) { if ($r.Label -eq "found") { Out-Line ("  {0}found  {1} {2}{3}{4}" -f $C.dim, $C.off, $C.fg, $r.Name, $C.off) } }
  foreach ($label in "skill", "rules", "preset") {
    $rows = @($script:Results | Where-Object { $_.Label -eq $label })
    if (-not $rows.Count) { continue }
    $words = @($rows | ForEach-Object { $_.Word } | Select-Object -Unique)
    $word = if ($words.Count -eq 1) { $words[0] } elseif ($words -contains "removed") { "removed" } elseif (($words -join " ") -match "skipped|missing|outdated") { "check" } else { "updated" }
    $names = @($rows | ForEach-Object { $_.Name } | Select-Object -Unique) -join ", "
    $extra = if ($label -eq "skill" -and $rows.Count -gt 1) { "$($C.dim)  in $($rows.Count) places$($C.off)" } else { "" }
    Out-Line ("  {0}{1,-7}{2} {3} {4}{5}{6}{7}" -f $C.dim, $label, $C.off, (Paint $word ("{0,-8}" -f $word)), $C.fg, $names, $C.off, $extra)
  }
}

$root = $null
if ($PSScriptRoot) {
  $candidate = Split-Path -Parent $PSScriptRoot
  if ((Test-Path (Join-Path $candidate "skills")) -and (Test-Path (Join-Path $candidate "AGENTS.md"))) { $root = $candidate }
}

function Phase-Stack {
  if ($script:root) { Row "stack" "" (Tilde $script:root); return }
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "git is needed to download SoulStack." }
  if (Test-Path (Join-Path $homeDir ".git")) {
    git -C $homeDir pull --ff-only --quiet
    if ($LASTEXITCODE -ne 0) { throw "git pull failed" }
    Row "stack" "updated" (Tilde $homeDir)
  } else {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $homeDir) | Out-Null
    git clone --quiet $repoUrl $homeDir
    if ($LASTEXITCODE -ne 0) { throw "git clone failed" }
    Row "stack" "created" (Tilde $homeDir)
  }
  $script:root = $homeDir
}

function Phase-Detect {
  $empryoBin = if ($env:LOCALAPPDATA) { Join-Path $env:LOCALAPPDATA "Empryo\bin\empryo.exe" } else { "" }
  $script:hasEmpryo = [bool](Get-Command empryo -ErrorAction SilentlyContinue) -or (Test-Path (Join-Path $UserHome ".empryo\config.json")) -or ($empryoBin -and (Test-Path $empryoBin))
  $script:hasClaude = [bool](Get-Command claude -ErrorAction SilentlyContinue) -or (Test-Path (Join-Path $UserHome ".claude"))
  $script:hasCodex = [bool](Get-Command codex -ErrorAction SilentlyContinue) -or (Test-Path (Join-Path $UserHome ".codex"))
  $script:copilotHome = if ($env:COPILOT_HOME) { $env:COPILOT_HOME } else { Join-Path $UserHome ".copilot" }
  $script:hasCopilot = [bool](Get-Command copilot -ErrorAction SilentlyContinue) -or (Test-Path $script:copilotHome)
  $found = @()
  if ($script:hasEmpryo) { $found += "Empryo" }
  if ($script:hasClaude) { $found += "Claude Code" }
  if ($script:hasCodex) { $found += "Codex" }
  if ($script:hasCopilot) { $found += "Copilot" }
  Row "found" "" $(if ($found.Count) { $found -join ", " } else { "no agents yet" })
  if (-not $script:hasEmpryo) { Row "" "" "no Empryo: skipping Empryo parts (https://empryo.com)" }
}

function Backup([string]$File) {
  if (-not (Test-Path $File)) { return "" }
  $b = "$File.bak-$stamp"
  $i = 1
  while (Test-Path $b) { $b = "$File.bak-$stamp-$i"; $i++ }
  Copy-Item $File $b
  return " (backed up)"
}

function Test-SkillReadable([string]$Dir) {
  try { $null = [IO.File]::ReadAllBytes((Join-Path $Dir "SKILL.md")); return $true } catch { return $false }
}

function New-SkillLink([string]$Dest, [string]$Src) {
  foreach ($kind in "SymbolicLink", "Junction") {
    try {
      New-Item -ItemType $kind -Path $Dest -Target $Src -ErrorAction Stop | Out-Null
      if (Test-SkillReadable $Dest) { return "linked" }
      (Get-Item $Dest).Delete()
    } catch {
      if (Test-Path $Dest) { (Get-Item $Dest).Delete() }
    }
  }
  Copy-Item -Recurse $Src $Dest
  New-Item -ItemType File -Path (Join-Path $Dest ".soulstack-copy") | Out-Null
  return "copied"
}

function Sync-Skills([string]$Target) {
  foreach ($dir in Get-ChildItem -Directory (Join-Path $script:root "skills")) {
    $src = $dir.FullName
    if (-not (Test-Path (Join-Path $src "SKILL.md"))) { continue }
    $dest = Join-Path $Target $dir.Name
    $item = Get-Item $dest -ErrorAction SilentlyContinue
    $linkTarget = if ($item -and $item.LinkType) { @($item.Target)[0] } else { $null }
    $ours = $linkTarget -and ([IO.Path]::GetFullPath($linkTarget).TrimEnd('\') -ieq [IO.Path]::GetFullPath($src).TrimEnd('\'))
    $isCopy = $item -and (-not $item.LinkType) -and (Test-Path (Join-Path $dest ".soulstack-copy"))
    if ($mode -eq "remove") {
      if ($ours) { $item.Delete(); Row "skill" "removed" (Item $dir.Name (Tilde $dest)) }
      elseif ($isCopy) { Remove-Item -Recurse -Force $dest; Row "skill" "removed" (Item $dir.Name (Tilde $dest)) }
      continue
    }
    if ($ours -and (Test-SkillReadable $dest)) { Row "skill" "same" (Item $dir.Name (Tilde $dest)); continue }
    if ($mode -eq "check") {
      if ($isCopy) { Row "skill" "copied" (Item $dir.Name (Tilde $dest)) } else { Row "skill" "missing" (Item $dir.Name (Tilde $dest)) }
      continue
    }
    if ($item -and -not $item.LinkType -and -not $isCopy) { Row "skill" "skipped" (Item $dir.Name "$(Tilde $dest) is not ours"); continue }
    New-Item -ItemType Directory -Force -Path $Target | Out-Null
    if ($item -and $item.LinkType) { $item.Delete() }
    if ($isCopy) { Remove-Item -Recurse -Force $dest }
    $how = New-SkillLink $dest $src
    Row "skill" $how (Item $dir.Name (Tilde $dest))
  }
}

$utf8 = New-Object System.Text.UTF8Encoding $false
$nl = "`n"
$startTag = "<!-- soulstack:start -->"
$endTag = "<!-- soulstack:end -->"
$pattern = "(?s)" + [regex]::Escape($startTag) + ".*?" + [regex]::Escape($endTag)

function Sync-Rules([string]$File, [string]$Label) {
  $takeaways = [IO.File]::ReadAllText((Join-Path $script:root "guides\takeaways.md")).Replace("`r`n", "`n").TrimEnd("`n")
  $block = $startTag + $nl + $takeaways + $nl + $endTag
  $exists = Test-Path $File
  $text = if ($exists) { [IO.File]::ReadAllText($File) } else { "" }
  $has = $text.Contains($startTag) -and $text.Contains($endTag)
  if ($mode -eq "remove") {
    if ($has) {
      $note = Backup $File
      $out = [regex]::Replace($text, "(\r?\n)?" + $pattern + "(\r?\n)?", $nl)
      [IO.File]::WriteAllText($File, $out.TrimEnd("`r", "`n") + $nl, $utf8)
      Row "rules" "removed" (Item $Label "$(Tilde $File)$note")
    }
    return
  }
  if ($has) {
    $current = [regex]::Match($text, $pattern).Value.Replace("`r`n", "`n")
    if ($current -eq $block) { Row "rules" "same" (Item $Label (Tilde $File)); return }
    if ($mode -eq "check") { Row "rules" "outdated" (Item $Label (Tilde $File)); return }
    $note = Backup $File
    $out = [regex]::Replace($text, $pattern, { param($m) $block })
    [IO.File]::WriteAllText($File, $out, $utf8)
    Row "rules" "updated" (Item $Label "$(Tilde $File)$note")
    return
  }
  if ($mode -eq "check") { Row "rules" "missing" (Item $Label (Tilde $File)); return }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $File) | Out-Null
  if ($exists) {
    $note = Backup $File
    [IO.File]::WriteAllText($File, $text.TrimEnd("`r", "`n") + $nl + $nl + $block + $nl, $utf8)
    Row "rules" "added" (Item $Label "$(Tilde $File)$note")
  } else {
    [IO.File]::WriteAllText($File, $block + $nl, $utf8)
    Row "rules" "created" (Item $Label (Tilde $File))
  }
}

function Add-Presets([string[]]$Files) {
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Config) | Out-Null
  $cfg = [pscustomobject]@{}
  $note = Backup $Config
  if (Test-Path $Config) {
    $raw = [IO.File]::ReadAllText($Config)
    if ($raw.Trim()) { $cfg = $raw | ConvertFrom-Json }
  }
  $list = New-Object System.Collections.Generic.List[string]
  if ($cfg.PSObject.Properties["presets"]) { foreach ($s in @($cfg.presets)) { if ($s -is [string]) { $list.Add($s) } } }
  $new = @()
  foreach ($f in $Files) { if ($list.Contains($f)) { Row "preset" "same" (Item ([IO.Path]::GetFileNameWithoutExtension($f)) (Tilde $Config)) } else { $list.Add($f); $new += $f } }
  if (-not $new.Count) { return }
  $cfg | Add-Member -NotePropertyName presets -NotePropertyValue ([string[]]$list.ToArray()) -Force
  [IO.File]::WriteAllText($Config, (ConvertTo-Json -InputObject $cfg -Depth 100) + $nl, $utf8)
  foreach ($f in $new) { Row "preset" "added" (Item ([IO.Path]::GetFileNameWithoutExtension($f)) "$(Tilde $Config)$note"); $note = "" }
}

function Phase-Skills {
  Sync-Skills $Skills
  $claudeSkills = Join-Path $UserHome ".claude\skills"
  if ($script:hasClaude -and ($Skills -ne $claudeSkills)) { Sync-Skills $claudeSkills }
}

function Phase-Rules {
  if ($script:hasEmpryo) { Sync-Rules (Join-Path $UserHome ".empryo\EMPRYO.md") "Empryo" }
  if ($script:hasClaude) { Sync-Rules (Join-Path $UserHome ".claude\CLAUDE.md") "Claude Code" }
  if ($script:hasCodex) { Sync-Rules (Join-Path $UserHome ".codex\AGENTS.md") "Codex" }
  if ($script:hasCopilot) { Sync-Rules (Join-Path $script:copilotHome "copilot-instructions.md") "Copilot" }
}

function Phase-Presets {
  if (-not $Presets -or $mode -ne "install") { return }
  if (-not $script:hasEmpryo) { Row "preset" "skipped" "Empryo not found"; return }
  $files = foreach ($name in ($Presets.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ })) {
    $f = Join-Path $script:root "plugins\presets\$name.json"
    if (-not (Test-Path $f)) { throw "unknown preset: $name" }
    $f
  }
  Add-Presets @($files)
}

if (-not $fancy) {
  Out-Line "SoulStack: Empryo x ProxySoul"
  Phase-Stack
  Phase-Detect
  Out-Line ""
  Phase-Skills
  Phase-Rules
  Phase-Presets
} else {
  [Console]::Write("$e[?25l" + ("`n" * 7))
  try {
    $label = "starting"
    for ($i = 1; $i -le 20; $i++) {
      switch ($i) {
        2 { $label = "getting SoulStack"; Phase-Stack }
        6 { $label = "finding agents"; Phase-Detect }
        10 { $label = "linking skills"; Phase-Skills }
        14 { $label = "writing rules"; Phase-Rules }
        17 { $label = "adding presets"; Phase-Presets }
        20 { $label = "done" }
      }
      [Console]::Write("$e[7A")
      Draw-Frame $i $label
      Start-Sleep -Milliseconds 60
    }
  } finally {
    [Console]::Write("$e[?25h")
  }
  Show-Summary
}

Out-Line ""
switch ($mode) {
  "check" { Out-Line "  $($C.dim)Checked. Nothing was changed.$($C.off)" }
  "remove" { Out-Line "  $($C.dim)Removed.$($C.off)" }
  default { Out-Line "  $($C.ok)Done.$($C.off) $($C.dim)Restart your agent to load SoulStack.$($C.off)" }
}
if ($script:backedUp -and $mode -ne "check") { Out-Line "  $($C.dim)Backups end in .bak-$stamp next to each changed file.$($C.off)" }
