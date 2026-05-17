param(
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# engram-export-all (migración final)
# - Migra TODO knowledge/ a Engram local.
# - No crea backup.
# - Ejecuta secret-scan antes de importar cualquier cosa.
# - En -DryRun no escribe, no importa y no borra.
# - En ejecución real crea manifest/estado temporal y los borra si termina OK.

function Write-Info($m){ Write-Host "[INFO] $m" -ForegroundColor Blue }
function Write-Ok($m){ Write-Host "[OK] $m" -ForegroundColor Green }
function Write-Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Err($m){ Write-Host "[ERROR] $m" -ForegroundColor Red }

if (-not $DryRun -and -not (Get-Command engram -ErrorAction SilentlyContinue)) {
  Write-Err "No encontré 'engram' en PATH."
  exit 10
}

$repoDir = if ($env:AGENTES_IA_REPO_DIR) { $env:AGENTES_IA_REPO_DIR } else { (Get-Location).Path }
$knowledgeDir = Join-Path $repoDir "knowledge"
$reportFile = Join-Path $repoDir "engram-migration-report.json"
$manifestFile = Join-Path $repoDir ".engram-migration-manifest.json"
$tempStateFile = Join-Path $repoDir ".engram-migration-state.json"
$script:importedCount = 0

function Write-MigrationReport([string]$Status, [int]$Imported, [bool]$Deleted, [string]$Message, [string]$Recommendation = "") {
  if ($DryRun) {
    Write-Info "Reporte dry-run: status=$Status imported=$Imported deletedKnowledgeDir=$Deleted message=$Message"
    if ($Recommendation) { Write-Warn "Acción recomendada: $Recommendation" }
    return
  }

  $report = [ordered]@{
    status = $Status
    importedCount = $Imported
    deletedKnowledgeDir = $Deleted
    backupCreated = $false
    manifestRemoved = ($Status -eq 'ok')
    tempStateRemoved = ($Status -eq 'ok')
    dryRun = $false
    message = $Message
    writtenAt = (Get-Date).ToUniversalTime().ToString('o')
  }
  if ($Recommendation) { $report.recommendedAction = $Recommendation }
  $report | ConvertTo-Json -Depth 5 | Set-Content -Path $reportFile -Encoding UTF8
}

function Remove-Temporaries {
  Remove-Item -Path $manifestFile,$tempStateFile -Force -ErrorAction SilentlyContinue
}

function Invoke-SecretScan {
  $pattern = '(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9_]{20,}|sk_live_[A-Za-z0-9_\-]{12,}|-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----|[A-Za-z0-9_]*SECRET[A-Za-z0-9_]*\s*=\s*\S+|[A-Za-z0-9_]*TOKEN[A-Za-z0-9_]*\s*=\s*\S+)'
  $findings = @()
  Get-ChildItem -Path $knowledgeDir -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
    $file = $_.FullName
    $lineNumber = 0
    Get-Content -Path $file -ErrorAction SilentlyContinue | ForEach-Object {
      $lineNumber++
      if ($_ -match $pattern) {
        $relative = Resolve-Path -Path $file -Relative
        $findings += [pscustomobject]@{ Path = $relative; Line = $lineNumber; Excerpt = $_.Substring(0, [Math]::Min(120, $_.Length)) }
      }
    }
  }
  return $findings
}

if (-not (Test-Path $knowledgeDir)) {
  Write-Warn "No detecté knowledge/ en '$repoDir'. No hay migración full para ejecutar."
  exit 0
}

try {
  Write-Info "Secret-scan previo sobre knowledge/ completo"
  $findings = Invoke-SecretScan
  if ($findings.Count -gt 0) {
    foreach ($finding in $findings) { Write-Warn "Posible secreto: $($finding.Path):$($finding.Line) - $($finding.Excerpt)" }
    $recommendation = "Revisa el hallazgo, redacta o elimina el secreto y decide explicitamente si corresponde reintentar. No se importo ni subio nada."
    Write-MigrationReport -Status "blocked" -Imported 0 -Deleted $false -Message "Secret-scan bloqueo la migracion por posibles secretos." -Recommendation $recommendation
    Write-Err $recommendation
    exit 40
  }

  $knowledgeFiles = Get-ChildItem -Path $knowledgeDir -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Extension -in '.md','.txt','.json','.log' } |
    Sort-Object FullName

  if ($DryRun) {
    Write-MigrationReport -Status "dry-run" -Imported 0 -Deleted $false -Message "Se simularia migracion completa de $($knowledgeFiles.Count) archivos de knowledge/ a Engram local."
    Write-Ok "Dry-run OK: no se escribio, importo ni borro nada."
    exit 0
  }

  $manifest = [ordered]@{ source = 'knowledge'; target = 'engram-local'; backupCreated = $false; files = @($knowledgeFiles | ForEach-Object { $_.FullName.Replace($repoDir, '').TrimStart('\','/') }) }
  $manifest | ConvertTo-Json -Depth 5 | Set-Content -Path $manifestFile -Encoding UTF8
  @{ status = 'running'; importedCount = 0 } | ConvertTo-Json | Set-Content -Path $tempStateFile -Encoding UTF8

  foreach ($file in $knowledgeFiles) {
    $relative = $file.FullName.Replace($repoDir, '').TrimStart('\','/')
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction Stop
    & engram save "[knowledge-migration] $relative" "Origen: $relative`n`n$content" --type knowledge | Out-Null
    $script:importedCount++
    @{ status = 'running'; importedCount = $script:importedCount; lastImported = $relative } | ConvertTo-Json | Set-Content -Path $tempStateFile -Encoding UTF8
  }

  Remove-Item -Path $knowledgeDir -Recurse -Force
  Remove-Temporaries
  Write-MigrationReport -Status "ok" -Imported $script:importedCount -Deleted $true -Message "Migracion completa OK: knowledge/ importado a Engram local y eliminado del proyecto."
  Write-Ok "Migracion completa OK. Archivos importados: $script:importedCount. knowledge/ fue eliminado."
} catch {
  Write-MigrationReport -Status "error" -Imported $script:importedCount -Deleted $false -Message "Migracion interrumpida: $($_.Exception.Message). knowledge/ no fue borrado."
  throw
}
