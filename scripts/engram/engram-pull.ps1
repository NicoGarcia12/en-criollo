$ErrorActionPreference = "Stop"

# engram-pull (strict)
# strict prechecks git + pending commits push + switch principal + pull + sync repo->local

function Write-Info($m){ Write-Host "[INFO] $m" -ForegroundColor Blue }
function Write-Ok($m){ Write-Host "[OK] $m" -ForegroundColor Green }
function Write-Err($m){ Write-Host "[ERROR] $m" -ForegroundColor Red }

$repoDir = if ($env:AGENTES_IA_REPO_DIR) { $env:AGENTES_IA_REPO_DIR } else { (Get-Location).Path }
$localEngram = if ($env:ENGRAM_LOCAL_DIR) { $env:ENGRAM_LOCAL_DIR } else { Join-Path $HOME ".engram" }
$repoEngram = Join-Path $repoDir "engram"
$branches = if ($env:ENGRAM_PRIMARY_BRANCHES) { $env:ENGRAM_PRIMARY_BRANCHES -split ' ' } else { @('main','master') }

if (-not (Test-Path (Join-Path $repoDir ".git"))) { Write-Err "Repo inválido: $repoDir"; exit 30 }
if (-not (Test-Path $repoEngram)) { Write-Err "No existe carpeta engram del repo"; exit 31 }

$dirty = (& git -C $repoDir status --porcelain)
if ($dirty) { Write-Err "Precheck estricto: cambios locales detectados."; exit 32 }

$primary = $null
foreach ($b in $branches) {
  & git -C $repoDir rev-parse --verify $b *> $null
  if ($LASTEXITCODE -eq 0) { $primary = $b; break }
}
if (-not $primary) { Write-Err "No encontré rama principal: $($branches -join ', ')"; exit 33 }

$current = (& git -C $repoDir branch --show-current).Trim()
if ($current -ne $primary) {
  Write-Info "switch principal: $primary"
  & git -C $repoDir switch $primary
}

$pending = (& git -C $repoDir rev-list --count "@{u}..HEAD" 2>$null)
if ($pending -and $pending -ne '0') {
  Write-Info "Hay pending commits: push antes del pull"
  & git -C $repoDir push
}

& git -C $repoDir pull --ff-only

New-Item -ItemType Directory -Path $localEngram -Force | Out-Null
Write-Info "sync repo=>local"
Copy-Item (Join-Path $repoEngram "*") $localEngram -Recurse -Force

Write-Ok "engram-pull OK"
exit 0
