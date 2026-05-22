param(
  [switch]$DryRun,
  [string]$AgentSources = "claude,opencode",
  [string]$AgentSessionSource = "",
  [int]$AgentSessionBatchSize = 25,
  [int]$AgentSessionLimit = 0,
  [int]$AgentSessionOffset = 0,
  [switch]$PlanAgentSessions,
  [string]$ReportFile
)

$ErrorActionPreference = "Stop"

# engram-export-all (migración final)
# - Migra TODO knowledge/ a Engram local.
# - No crea backup.
# - Ejecuta secret-scan antes de importar cualquier cosa.
# - En -DryRun no escribe, no importa y no borra.
# - En ejecución real crea manifest/estado temporal y los borra si termina OK.
# - Por defecto muestra el reporte JSON por consola; -ReportFile <path> lo guarda explícitamente.
# - Siempre intenta importar sesiones históricas Claude Code/OpenCode.
# - Las sesiones de agentes se planifican/importan en batches (default 25) y cada
#   sesión grande sigue usando chunking intra-sesión para evitar límites de CLI.

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
$manifestFile = Join-Path $repoDir ".engram-migration-manifest.json"
$tempStateFile = Join-Path $repoDir ".engram-migration-state.json"
$script:importedCount = 0
$script:agentSessionDetectedCount = 0
$script:agentSessionSavedCount = 0
$script:agentSessionBlockedCount = 0
$script:opencodeSkippedWithoutSqlite3 = $false
$script:claudeDetectedSessions = 0
$script:opencodeDetectedSessions = 0
$script:agentReport = $null
$script:agentSessionBatches = @()
if ($AgentSessionSource) { $AgentSources = $AgentSessionSource }
if ($env:ENGRAM_AGENT_SESSION_BATCH_SIZE -and -not $PSBoundParameters.ContainsKey('AgentSessionBatchSize')) {
  $AgentSessionBatchSize = [int]$env:ENGRAM_AGENT_SESSION_BATCH_SIZE
}
if ($AgentSessionBatchSize -lt 1) { Write-Err "AgentSessionBatchSize debe ser un entero positivo."; exit 2 }
if ($AgentSessionLimit -lt 0) { Write-Err "AgentSessionLimit no puede ser negativo."; exit 2 }
if ($AgentSessionOffset -lt 0) { Write-Err "AgentSessionOffset no puede ser negativo."; exit 2 }
if ($PlanAgentSessions) {
  $DryRun = $true
}

function Write-MigrationReport([string]$Status, [int]$Imported, [bool]$Deleted, [string]$Message, [string]$Recommendation = "") {
  $report = [ordered]@{
    status = $Status
    importedCount = $Imported
    deletedKnowledgeDir = $Deleted
    backupCreated = $false
    manifestRemoved = ($Status -eq 'ok')
    tempStateRemoved = ($Status -eq 'ok')
    dryRun = [bool]$DryRun
    message = $Message
    writtenAt = (Get-Date).ToUniversalTime().ToString('o')
  }
  if ($Recommendation) { $report.recommendedAction = $Recommendation }
  if ($script:agentReport) { $report.agentSessions = $script:agentReport }
  $json = $report | ConvertTo-Json -Depth 5
  Write-Output $json
  if ($ReportFile) {
    $json | Set-Content -Path $ReportFile -Encoding UTF8
  }
}

function Remove-Temporaries {
  Remove-Item -Path $manifestFile,$tempStateFile -Force -ErrorAction SilentlyContinue
}

function Invoke-SecretScan {
  param([string[]]$Paths = @($knowledgeDir), [string]$AgentSessionText = "", [string]$Label = "")
  $pattern = '(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9_]{20,}|sk_live_[A-Za-z0-9_\-]{12,}|-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----|[A-Za-z0-9_]*SECRET[A-Za-z0-9_]*\s*=\s*\S+|[A-Za-z0-9_]*TOKEN[A-Za-z0-9_]*\s*=\s*\S+)'
  $findings = @()
  if ($AgentSessionText) {
    $lineNumber = 0
    $AgentSessionText -split "`n" | ForEach-Object {
      $lineNumber++
      if ($_ -match $pattern) {
        $findings += [pscustomobject]@{ Path = "agent sessions/$Label"; Line = $lineNumber; Excerpt = $_.Substring(0, [Math]::Min(120, $_.Length)) }
      }
    }
    return $findings
  }
  foreach ($path in $Paths) {
    Get-ChildItem -Path $path -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
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
  }
  return $findings
}

function Test-AgentSourceEnabled([string]$Source) {
  $sources = @($AgentSources.Split(',') | ForEach-Object { $_.Trim().ToLower() })
  return $sources -contains $Source
}

function Get-EncodedWorktree {
  return ($repoDir -replace '[\\/]', '-')
}

function Get-TextSha256([string]$Text) {
  $bytes = [Text.Encoding]::UTF8.GetBytes($Text)
  $hash = [Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
  return (($hash | ForEach-Object { $_.ToString('x2') }) -join '')
}

function Update-AgentSessionsReport {
  $encoded = Get-EncodedWorktree
  $totalSessions = $script:agentSessionDetectedCount
  $totalBatches = if ($totalSessions -gt 0) { [int][Math]::Ceiling($totalSessions / $AgentSessionBatchSize) } else { 0 }
  $script:agentReport = [ordered]@{
    enabled = $true
    dryRun = [bool]$DryRun
    batchSize = $AgentSessionBatchSize
    totalSessions = $totalSessions
    totalBatches = $totalBatches
    sessionLimit = $(if ($AgentSessionLimit -gt 0) { $AgentSessionLimit } else { $null })
    sessionOffset = $(if ($AgentSessionOffset -gt 0) { $AgentSessionOffset } else { $null })
    batches = @($script:agentSessionBatches)
    sources = [ordered]@{
      claude = [ordered]@{
        scannedPath = "~/.claude/projects/$encoded/*.jsonl"
        ignoredPath = "~/.claude/sessions/*.json"
        detectedSessions = $script:claudeDetectedSessions
        blockedSessions = $script:agentSessionBlockedCount
      }
      opencode = [ordered]@{
        scannedPath = "~/.local/share/opencode/opencode.db"
        filter = "project.worktree = $repoDir"
        detectedSessions = $script:opencodeDetectedSessions
        skippedWithoutSqlite3 = [bool]$script:opencodeSkippedWithoutSqlite3
      }
    }
    engramSaveCalled = (-not $DryRun -and $script:agentSessionSavedCount -gt 0)
  }
}

function Test-AgentSessionLimitReached {
  return ($AgentSessionLimit -gt 0 -and $script:agentSessionDetectedCount -ge $AgentSessionLimit)
}

function Update-AgentSessionBatchPlan {
  $totalSessions = $script:agentSessionDetectedCount
  if ($totalSessions -le 0) { $script:agentSessionBatches = @(); return }
  $totalBatches = [int][Math]::Ceiling($totalSessions / $AgentSessionBatchSize)
  $plan = @()
  for ($i = 1; $i -le $totalBatches; $i++) {
    $start = (($i - 1) * $AgentSessionBatchSize) + 1
    $end = [Math]::Min($i * $AgentSessionBatchSize, $totalSessions)
    $plan += [ordered]@{
      batchIndex = $i
      batchSize = $AgentSessionBatchSize
      sessionCount = ($end - $start + 1)
      startSession = $start
      endSession = $end
    }
  }
  $script:agentSessionBatches = $plan
  $currentBatch = [int][Math]::Ceiling($totalSessions / $AgentSessionBatchSize)
  Write-Info "Agent session batch plan: session=$totalSessions batch=$currentBatch batchSize=$AgentSessionBatchSize"
}

function Save-AgentSession([string]$Source, [string]$SessionId, [string]$Content) {
  $script:agentSessionDetectedCount++
  Update-AgentSessionBatchPlan
  $findings = @(Invoke-SecretScan -AgentSessionText $Content -Label "$Source/$SessionId")
  if ($findings.Count -gt 0) {
    foreach ($finding in $findings) { Write-Warn "Posible secreto en agent sessions $($finding.Path):$($finding.Line) - $($finding.Excerpt)" }
    $script:agentSessionBlockedCount++
    throw "secret_scan agent sessions blocked/bloqueo"
  }
  if ($DryRun) {
    # Dry-run de agent_sessions: Write-MigrationReport reporta; sin ejecutar engram save.
    return
  }

  $chunkLimit = if ($env:ENGRAM_EXPORT_CHUNK_CHAR_LIMIT) { [int]$env:ENGRAM_EXPORT_CHUNK_CHAR_LIMIT } else { 120000 }
  $contentChars = $Content.Length
  if ($contentChars -le $chunkLimit) {
    & engram save "[agent-session][$Source] $SessionId" $Content --type agent_session | Out-Null
    $script:agentSessionSavedCount++
    return
  }

  $sessionHash = Get-TextSha256 $Content
  $sessionDocId = Get-TextSha256 "$Source|$SessionId|$sessionHash"
  $totalChunks = [Math]::Ceiling($contentChars / $chunkLimit)
  $previousRef = 'none'
  Write-Info "Chunking automatico agent session: $Source/$SessionId (chars=$contentChars, chunks=$totalChunks)"

  for ($chunkIndex = 1; $chunkIndex -le $totalChunks; $chunkIndex++) {
    $start = ($chunkIndex - 1) * $chunkLimit
    $length = [Math]::Min($chunkLimit, $Content.Length - $start)
    $chunkPayload = $Content.Substring($start, $length)
    $chunkHash = Get-TextSha256 $chunkPayload
    $chunkRef = "${sessionDocId}:${chunkIndex}/${totalChunks}:${chunkHash}"
    $nextRef = if ($chunkIndex -lt $totalChunks) { "${sessionDocId}:$($chunkIndex + 1)/${totalChunks}" } else { 'none' }
    $body = "Origen: agent-session/$Source/$SessionId`n`n---`nmigration_mode: agent_session_chunked`nagent_source: $Source`nsession_id: $SessionId`ndoc_id: $sessionDocId`nchunk_index: $chunkIndex`ntotal_chunks: $totalChunks`ncontent_hash: $sessionHash`nchunk_prev: $previousRef`nchunk_next: $nextRef`n---`n`n$chunkPayload"
    & engram save "[agent-session][$Source][chunk $chunkIndex/$totalChunks] $SessionId" $body --type agent_session | Out-Null
    $script:agentSessionSavedCount++
    Write-Info "Chunk agent session guardado: $Source/$SessionId [$chunkIndex/$totalChunks] doc_id=$sessionDocId"
    $previousRef = $chunkRef
  }
}

function Import-ClaudeAgentSessions {
  $encoded = Get-EncodedWorktree
  $claudeDir = Join-Path $HOME ".claude/projects/$encoded"
  $ignoredDir = Join-Path $HOME ".claude/sessions"
  Write-Info "Claude agent sessions: buscando ~/.claude/projects/$encoded/*.jsonl; ~/.claude/sessions/*.json se ignora por metadata."
  if (Test-Path $ignoredDir) { Write-Info "Claude metadata ignorada: ~/.claude/sessions/*.json" }
  if (-not (Test-Path $claudeDir)) { return }
  Get-ChildItem -Path $claudeDir -Filter '*.jsonl' -File -ErrorAction SilentlyContinue | Sort-Object FullName | ForEach-Object {
    if (Test-AgentSessionLimitReached) { return }
    $relative = $_.FullName.Replace($HOME, '~')
    $content = Get-Content -Path $_.FullName -Raw -ErrorAction Stop
    $payload = "Origen: $relative`n`n---`nmigration_mode: agent_session`nagent_source: claude`nsource_path: $relative`nworktree: $repoDir`n---`n`n$content"
    $script:claudeDetectedSessions++
    Save-AgentSession -Source "claude" -SessionId $_.BaseName -Content $payload
  }
}

function Import-OpenCodeAgentSessions {
  $db = Join-Path $HOME ".local/share/opencode/opencode.db"
  if (-not (Test-Path $db)) { return }
  $sqlite = Get-Command sqlite3 -ErrorAction SilentlyContinue
  if (-not $sqlite) {
    Write-Warn "sqlite3 no está disponible; skip/omitir/continuar OpenCode agent sessions sin romper la migración completa."
    $script:opencodeSkippedWithoutSqlite3 = $true
    return
  }
  $repoSql = $repoDir.Replace("'", "''")
  $sqlLimitClause = if ($AgentSessionLimit -gt 0) { " LIMIT $AgentSessionLimit" } else { "" }
  $sqlOffsetClause = if ($AgentSessionOffset -gt 0) { " OFFSET $AgentSessionOffset" } else { "" }
  if ($sqlOffsetClause -and -not $sqlLimitClause) { $sqlLimitClause = " LIMIT -1" }
  $sql = "SELECT s.id, s.time_created, COALESCE((SELECT group_concat(om.data, char(30)) FROM (SELECT m.data FROM message m WHERE m.session_id = s.id ORDER BY m.time_created, m.id) om), '') FROM session s JOIN project ON project.id = s.project_id WHERE project.worktree = '$repoSql' ORDER BY s.time_created$sqlLimitClause$sqlOffsetClause;"
  $rows = @(& sqlite3 -batch -noheader -separator "`t" $db $sql 2>$null)
  foreach ($row in $rows) {
    if ([string]::IsNullOrWhiteSpace($row)) { continue }
    if (Test-AgentSessionLimitReached) { break }
    $parts = $row -split "`t", 3
    $sessionId = $parts[0]
    $createdAt = if ($parts.Count -gt 1) { $parts[1] } else { '' }
    $body = if ($parts.Count -gt 2) { $parts[2] -replace [char]30, "`n" } else { '' }
    $payload = "Origen: ~/.local/share/opencode/opencode.db`n`n---`nmigration_mode: agent_session`nagent_source: opencode`nsession_id: $sessionId`ncreated_at: $createdAt`nworktree: $repoDir`n---`n`n$body"
    $script:opencodeDetectedSessions++
    Save-AgentSession -Source "opencode" -SessionId $sessionId -Content $payload
  }
}

function Import-AgentSessions {
  if (Test-AgentSourceEnabled "claude") { Import-ClaudeAgentSessions }
  if (-not (Test-AgentSessionLimitReached) -and (Test-AgentSourceEnabled "opencode")) { Import-OpenCodeAgentSessions }
  Update-AgentSessionsReport
}

try {
  if (Test-Path $knowledgeDir) {
    Write-Info "Secret-scan previo sobre knowledge/ completo"
    $findings = @(Invoke-SecretScan)
    if ($findings.Count -gt 0) {
      foreach ($finding in $findings) { Write-Warn "Posible secreto: $($finding.Path):$($finding.Line) - $($finding.Excerpt)" }
      $recommendation = "Revisa el hallazgo, redacta o elimina el secreto y decide explicitamente si corresponde reintentar. No se importo ni subio nada."
      Write-MigrationReport -Status "blocked" -Imported 0 -Deleted $false -Message "Secret-scan bloqueo la migracion por posibles secretos." -Recommendation $recommendation
      Write-Err $recommendation
      exit 40
    }
  } else {
    Write-Warn "No detecté knowledge/ en '$repoDir'. No hay migración full de knowledge para ejecutar."
  }

  try { Import-AgentSessions } catch {
    Update-AgentSessionsReport
    $recommendation = "Revisa/redacta la sesion historica bloqueada por secret-scan antes de reintentar."
    Write-MigrationReport -Status "blocked" -Imported 0 -Deleted $false -Message "Secret-scan bloqueo agent sessions Claude/OpenCode por posibles secretos." -Recommendation $recommendation
    Write-Err $recommendation
    exit 40
  }

  $knowledgeFiles = @()
  if (Test-Path $knowledgeDir) {
    $knowledgeFiles = @(Get-ChildItem -Path $knowledgeDir -Recurse -File -ErrorAction SilentlyContinue |
      Where-Object { @('.md','.txt','.json','.log') -contains $_.Extension } |
      Sort-Object FullName)
  }

  if ($DryRun) {
    if ($PlanAgentSessions) {
      Write-MigrationReport -Status "dry-run" -Imported 0 -Deleted $false -Message "Plan agent sessions: se detectaron $script:agentSessionDetectedCount sesiones en batches de $AgentSessionBatchSize; no se importo nada."
    } else {
      Write-MigrationReport -Status "dry-run" -Imported 0 -Deleted $false -Message "Se simularia migracion completa de $($knowledgeFiles.Count) archivos de knowledge/ y $script:agentSessionDetectedCount agent sessions a Engram local."
    }
    Write-Ok "Dry-run OK: no se escribio, importo ni borro nada."
    exit 0
  }

  if (-not (Test-Path $knowledgeDir)) {
    Write-MigrationReport -Status "ok" -Imported $script:agentSessionSavedCount -Deleted $false -Message "Migracion OK: agent sessions importadas; no habia knowledge/ para eliminar."
    Write-Ok "Migracion OK. Agent sessions importadas: $script:agentSessionSavedCount."
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
  Write-MigrationReport -Status "ok" -Imported ($script:importedCount + $script:agentSessionSavedCount) -Deleted $true -Message "Migracion completa OK: knowledge/ y agent sessions importados a Engram local; knowledge/ eliminado del proyecto."
  Write-Ok "Migracion completa OK. Archivos importados: $script:importedCount. Agent sessions importadas: $script:agentSessionSavedCount. knowledge/ fue eliminado."
} catch {
  Write-MigrationReport -Status "error" -Imported $script:importedCount -Deleted $false -Message "Migracion interrumpida: $($_.Exception.Message). knowledge/ no fue borrado."
  throw
}
