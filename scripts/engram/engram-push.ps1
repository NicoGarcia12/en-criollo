$ErrorActionPreference = "Stop"

# engram-push (strict)
# strict prechecks git + switch principal + pending commits push + sync local->repo + commit.
# Si hay consola interactiva, el commit es asistido; si no, usa default para no bloquear CI.

function Write-Info($m){ Write-Host "[INFO] $m" -ForegroundColor Blue }
function Write-Ok($m){ Write-Host "[OK] $m" -ForegroundColor Green }
function Write-Err($m){ Write-Host "[ERROR] $m" -ForegroundColor Red }

$repoDir = if ($env:AGENTES_IA_REPO_DIR) { $env:AGENTES_IA_REPO_DIR } else { (Get-Location).Path }
$localEngram = if ($env:ENGRAM_LOCAL_DIR) { $env:ENGRAM_LOCAL_DIR } else { Join-Path $HOME ".engram" }
$repoEngram = Join-Path $repoDir "engram"
$branches = if ($env:ENGRAM_PRIMARY_BRANCHES) { $env:ENGRAM_PRIMARY_BRANCHES -split ' ' } else { @('main','master') }

if (-not (Test-Path (Join-Path $repoDir ".git"))) { Write-Err "Repo inválido: $repoDir"; exit 20 }
if (-not (Test-Path $localEngram)) { Write-Err "No existe ENGRAM local: $localEngram"; exit 21 }

function Get-AssistedCommitMessage {
  $primary = "chore(engram): sincronizar memoria local al repo"
  $alternative = "docs(engram): actualizar snapshot de memoria operativa"
  $englishPrimary = "chore(engram): sync local memory to repo"
  $englishAlternative = "docs(engram): update operational memory snapshot"

  if ([Console]::IsInputRedirected) { return $englishPrimary }

  Write-Info "Mensaje de commit propuesto:"
  Write-Host "  1) $primary"
  Write-Host "  2) $alternative"
  $selected = Read-Host "Elegí 1, 2 o escribí otro mensaje"

  $message = switch ($selected) {
    "1" { $primary; break }
    "2" { $alternative; break }
    "" { $primary; break }
    default { $selected }
  }

  $translate = Read-Host "¿Querés usarlo en inglés? [s/N]"
  if ($translate -match '^[sSyY]$') {
    if ($message -eq $primary) { $message = $englishPrimary }
    elseif ($message -eq $alternative) { $message = $englishAlternative }
    else { Write-Info "No hay traductor automático para mensajes libres; se usa el texto tal como lo escribiste." }
  }

  return $message
}

$dirty = (& git -C $repoDir status --porcelain)
if ($dirty) { Write-Err "Precheck estricto: worktree sucio. Resolvé antes."; exit 22 }

$primary = $null
foreach ($b in $branches) {
  & git -C $repoDir rev-parse --verify $b *> $null
  if ($LASTEXITCODE -eq 0) { $primary = $b; break }
}
if (-not $primary) { Write-Err "No encontré rama principal: $($branches -join ', ')"; exit 23 }

$current = (& git -C $repoDir branch --show-current).Trim()
if ($current -ne $primary) {
  Write-Info "switch principal: $primary"
  & git -C $repoDir switch $primary
}

$pending = (& git -C $repoDir rev-list --count "@{u}..HEAD" 2>$null)
if ($pending -and $pending -ne '0') {
  Write-Info "Pending commits detectados: push automático"
  & git -C $repoDir push
}

New-Item -ItemType Directory -Path $repoEngram -Force | Out-Null
Write-Info "sync local=>repo"
Copy-Item (Join-Path $localEngram "*") $repoEngram -Recurse -Force

$changes = (& git -C $repoDir status --porcelain -- $repoEngram)
if (-not $changes) { Write-Ok "Sin cambios de archivos para commitear"; exit 0 }

& git -C $repoDir add $repoEngram
$commitMessage = Get-AssistedCommitMessage
& git -C $repoDir commit -m $commitMessage
Write-Ok "engram-push OK"
exit 0
