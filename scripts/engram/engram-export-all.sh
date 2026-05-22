#!/usr/bin/env bash
set -euo pipefail

# engram-export-all (migración final)
# - Migra TODO knowledge/ a Engram local.
# - No crea backup: la regla final exige migración directa y controlada.
# - Ejecuta secret-scan antes de importar cualquier cosa.
# - En --dry-run no escribe, no importa y no borra.
# - En ejecución real crea manifest/estado temporal y los borra si termina OK.
# - Por defecto muestra el reporte JSON por consola; --report-file <path> lo guarda explícitamente.
# - Siempre intenta importar sesiones históricas Claude Code/OpenCode.
# - Las sesiones de agentes se planifican/importan en batches (default 25) y cada
#   sesión grande sigue usando chunking intra-sesión para evitar límites de CLI.

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info(){ printf "%b[INFO]%b %s\n" "$BLUE" "$NC" "$1"; }
ok(){ printf "%b[OK]%b %s\n" "$GREEN" "$NC" "$1"; }
warn(){ printf "%b[WARN]%b %s\n" "$YELLOW" "$NC" "$1"; }
err(){ printf "%b[ERROR]%b %s\n" "$RED" "$NC" "$1"; }

DRY_RUN=0
AGENT_SOURCES="claude,opencode"
AGENT_SESSION_BATCH_SIZE=${ENGRAM_AGENT_SESSION_BATCH_SIZE:-25}
AGENT_SESSION_LIMIT=""
AGENT_SESSION_OFFSET=""
PLAN_AGENT_SESSIONS=0
REPORT_FILE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --report-file)
      if [[ $# -lt 2 || -z "${2:-}" ]]; then
        err "--report-file requiere una ruta."
        exit 2
      fi
      REPORT_FILE="$2"
      shift 2
      ;;
    --agent-session-batch-size)
      if [[ $# -lt 2 || -z "${2:-}" ]]; then
        err "--agent-session-batch-size requiere un entero positivo."
        exit 2
      fi
      AGENT_SESSION_BATCH_SIZE="$2"
      shift 2
      ;;
    --agent-session-limit)
      if [[ $# -lt 2 || -z "${2:-}" ]]; then
        err "--agent-session-limit requiere un entero positivo."
        exit 2
      fi
      AGENT_SESSION_LIMIT="$2"
      shift 2
      ;;
    --agent-session-offset)
      if [[ $# -lt 2 || -z "${2:-}" ]]; then
        err "--agent-session-offset requiere un entero no negativo."
        exit 2
      fi
      AGENT_SESSION_OFFSET="$2"
      shift 2
      ;;
    --plan-agent-sessions|--agent-session-plan)
      PLAN_AGENT_SESSIONS=1
      DRY_RUN=1
      shift
      ;;
    --agent-sources|--agent-session-source)
      if [[ $# -lt 2 || -z "${2:-}" ]]; then
        err "$1 requiere fuentes: claude, opencode o claude,opencode."
        exit 2
      fi
      AGENT_SOURCES="$2"
      shift 2
      ;;
    *) err "Argumento no soportado: $1"; exit 2 ;;
  esac
done

if ! [[ "$AGENT_SESSION_BATCH_SIZE" =~ ^[1-9][0-9]*$ ]]; then
  err "AGENT_SESSION_BATCH_SIZE debe ser un entero positivo. Valor: $AGENT_SESSION_BATCH_SIZE"
  exit 2
fi
if [[ -n "$AGENT_SESSION_LIMIT" ]] && ! [[ "$AGENT_SESSION_LIMIT" =~ ^[1-9][0-9]*$ ]]; then
  err "--agent-session-limit debe ser un entero positivo. Valor: $AGENT_SESSION_LIMIT"
  exit 2
fi
if [[ -n "$AGENT_SESSION_OFFSET" ]] && ! [[ "$AGENT_SESSION_OFFSET" =~ ^[0-9]+$ ]]; then
  err "--agent-session-offset debe ser un entero no negativo. Valor: $AGENT_SESSION_OFFSET"
  exit 2
fi

if [[ "$DRY_RUN" -eq 0 ]] && ! command -v engram >/dev/null 2>&1; then
  err "No encontré 'engram' en PATH. Instalalo primero."
  exit 10
fi

REPO_DIR="${AGENTES_IA_REPO_DIR:-$(pwd)}"
KNOWLEDGE_DIR="$REPO_DIR/knowledge"
MANIFEST_FILE="$REPO_DIR/.engram-migration-manifest.json"
TEMP_STATE_FILE="$REPO_DIR/.engram-migration-state.json"
CHUNK_CHAR_LIMIT="${ENGRAM_EXPORT_CHUNK_CHAR_LIMIT:-100000}"
AGENT_REPORT_JSON=''
agent_session_detected_count=0
agent_session_saved_count=0
agent_session_blocked_count=0
agent_session_batches_json='[]'
opencode_skipped_without_sqlite3=false

write_report() {
  local status="$1" imported="$2" deleted="$3" message="$4" recommendation="${5:-}"
  local manifest_removed="false" temp_state_removed="false" dry_run_json="false"
  [[ "$status" == "ok" ]] && manifest_removed="true" && temp_state_removed="true"
  [[ "$DRY_RUN" -eq 1 ]] && dry_run_json="true"

  json_escape() {
    # Escapamos caracteres mínimos para emitir JSON válido sin depender de Python/jq.
    printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g; s/\r/\\r/g; s/\n/\\n/g'
  }

  local escaped_message escaped_recommendation written_at report
  escaped_message="$(json_escape "$message")"
  escaped_recommendation="$(json_escape "$recommendation")"
  written_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  report="{\n"
  report+="  \"status\": \"$status\",\n"
  report+="  \"importedCount\": $imported,\n"
  report+="  \"deletedKnowledgeDir\": $deleted,\n"
  report+="  \"backupCreated\": false,\n"
  report+="  \"manifestRemoved\": $manifest_removed,\n"
  report+="  \"tempStateRemoved\": $temp_state_removed,\n"
  report+="  \"dryRun\": $dry_run_json,\n"
  report+="  \"message\": \"$escaped_message\",\n"
  report+="  \"writtenAt\": \"$written_at\""
  if [[ -n "$recommendation" ]]; then
    report+=",\n  \"recommendedAction\": \"$escaped_recommendation\""
  fi
  if [[ -n "$AGENT_REPORT_JSON" ]]; then
    report+=",\n  \"agentSessions\": $AGENT_REPORT_JSON"
  fi
  report+="\n}"

  printf '%b\n' "$report"
  if [[ -n "$REPORT_FILE" ]]; then
    printf '%b\n' "$report" > "$REPORT_FILE"
  fi
}

cleanup_temporaries() {
  rm -f "$MANIFEST_FILE" "$TEMP_STATE_FILE"
}

cleanup_engram_tempdirs() {
  rm -f "$REPO_DIR"/.engram-chunk-tmp-*.chunk 2>/dev/null || true
  rm -f "$REPO_DIR"/.engram-agent-session-chunk-tmp-*.chunk 2>/dev/null || true
  rm -rf "$REPO_DIR"/.engram-chunks-tmp-* 2>/dev/null || true
  rm -rf "$REPO_DIR"/.engram-agent-session-chunks-tmp-* 2>/dev/null || true
}

on_abort() {
  local exit_code=$?
  cleanup_engram_tempdirs
  write_report "error" "${imported_count:-0}" "false" "Migración interrumpida con exit code $exit_code. knowledge/ no fue borrado." || true
  exit "$exit_code"
}
trap on_abort ERR SIGINT SIGTERM

sha256_of_file() {
  local f="$1"
  sha256sum "$f" | awk '{print $1}'
}

sha256_of_text() {
  local t="$1"
  printf '%s' "$t" | sha256sum | awk '{print $1}'
}

build_body_with_metadata() {
  local rel="$1"
  local doc_id="$2"
  local migration_batch_id="$3"
  local content_hash="$4"
  local chunk_index="$5"
  local total_chunks="$6"
  local chunk_prev="$7"
  local chunk_next="$8"
  local chunk_payload="$9"

  cat <<EOF
Origen: $rel

---
migration_mode: knowledge_chunked
doc_id: $doc_id
source_path: $rel
chunk_index: $chunk_index
total_chunks: $total_chunks
content_hash: $content_hash
chunk_prev: $chunk_prev
chunk_next: $chunk_next
migration_batch_id: $migration_batch_id
---

$chunk_payload
EOF
}

save_document_with_chunking() {
  local file="$1"
  local rel="$2"
  local migration_batch_id="$3"

  local doc_hash doc_id file_size
  doc_hash="$(sha256_of_file "$file")"
  doc_id="$(printf '%s' "$rel|$doc_hash" | sha256sum | awk '{print $1}')"
  file_size="$(wc -c < "$file" | tr -d ' ')"

  # Camino rápido para documentos chicos: 1 save, sin metadata extra de chunking.
  if (( file_size <= CHUNK_CHAR_LIMIT )); then
    local body
    body="$(printf 'Origen: %s\n\n' "$rel"; cat "$file")"
    engram save "[knowledge-migration] $rel" "$body" --type knowledge >/dev/null
    return 0
  fi

  local total_chunks chunk_index=1 prev_ref="none"
  total_chunks=$(( (file_size + CHUNK_CHAR_LIMIT - 1) / CHUNK_CHAR_LIMIT ))
  info "Chunking automático: $rel (bytes=$file_size, chunks=$total_chunks, batch=$migration_batch_id)"

  local chunk_dir
  chunk_dir="$(mktemp -d "$REPO_DIR/.engram-chunks-tmp-XXXXXX")"
  # Usamos split -b (bytes estrictos), no -C: las fuentes migradas pueden tener líneas
  # JSONL enormes y -C puede emitir chunks mayores al límite, rompiendo ARG_MAX.
  split -b "$CHUNK_CHAR_LIMIT" -d --additional-suffix=.chunk "$file" "$chunk_dir/chunk-"

  while IFS= read -r -d '' chunk_file; do
    [[ -f "$chunk_file" ]] || continue

    local chunk_payload chunk_hash chunk_ref next_ref body
    chunk_payload="$(cat "$chunk_file")"
    chunk_hash="$(sha256_of_file "$chunk_file")"
    chunk_ref="${doc_id}:${chunk_index}/${total_chunks}:${chunk_hash}"

    if (( chunk_index < total_chunks )); then
      next_ref="${doc_id}:$((chunk_index+1))/${total_chunks}"
    else
      next_ref="none"
    fi

    body="$(build_body_with_metadata "$rel" "$doc_id" "$migration_batch_id" "$doc_hash" "$chunk_index" "$total_chunks" "$prev_ref" "$next_ref" "$chunk_payload")"
    engram save "[knowledge-migration][chunk $chunk_index/$total_chunks] $rel" "$body" --type knowledge >/dev/null

    info "Chunk guardado: $rel [$chunk_index/$total_chunks] doc_id=$doc_id"
    prev_ref="$chunk_ref"
    chunk_index=$((chunk_index+1))
  done < <(find "$chunk_dir" -type f -name 'chunk-*.chunk' -print0 | sort -z)

  rm -rf "$chunk_dir" 2>/dev/null || true
}

secret_scan() {
  local findings=0
  while IFS= read -r -d '' file; do
    while IFS=: read -r line text; do
      [[ -z "${line:-}" ]] && continue
      warn "Posible secreto: ${file#${REPO_DIR}/}:$line"
      warn "Extracto: ${text:0:120}"
      findings=$((findings+1))
    done < <(grep -nE '(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9_]{20,}|sk_live_[A-Za-z0-9_\-]{12,}|-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----|[A-Za-z0-9_]*SECRET[A-Za-z0-9_]*[[:space:]]*=[[:space:]]*[A-Za-z0-9_\-\.\/\+]{12,}|[A-Za-z0-9_]*TOKEN[A-Za-z0-9_]*[[:space:]]*=[[:space:]]*[A-Za-z0-9_\-\.\/\+]{12,})' "$file" 2>/dev/null || true)
  done < <(find "$KNOWLEDGE_DIR" -type f -print0)
  [[ "$findings" -eq 0 ]]
}

secret_scan_text() {
  local label="$1" payload="$2"
  local findings=0
  while IFS=: read -r line text; do
    [[ -z "${line:-}" ]] && continue
    warn "Posible secreto en agent sessions: $label:$line"
    warn "Extracto: ${text:0:120}"
    findings=$((findings+1))
  done < <(printf '%s\n' "$payload" | grep -nE '(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9_]{20,}|sk_live_[A-Za-z0-9_\-]{12,}|-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----|[A-Za-z0-9_]*SECRET[A-Za-z0-9_]*[[:space:]]*=[[:space:]]*[A-Za-z0-9_\-\.\/\+]{12,}|[A-Za-z0-9_]*TOKEN[A-Za-z0-9_]*[[:space:]]*=[[:space:]]*[A-Za-z0-9_\-\.\/\+]{12,})' 2>/dev/null || true)
  [[ "$findings" -eq 0 ]]
}

agent_source_enabled() {
  local source="$1"
  case ",$(printf '%s' "$AGENT_SOURCES" | tr '[:upper:]' '[:lower:]' | tr -d ' ')," in
    *,"$source",*) return 0 ;;
    *) return 1 ;;
  esac
}

encoded_worktree() {
  printf '%s' "$REPO_DIR" | sed 's#[/\\]#-#g'
}

build_agent_sessions_report() {
  local enabled_json="false" dry_run_json="false"
  enabled_json="true"
  [[ "$DRY_RUN" -eq 1 ]] && dry_run_json="true"
  local encoded claude_detected opencode_detected save_called skipped_json total_sessions total_batches limit_json
  encoded="$(encoded_worktree)"
  claude_detected="${claude_detected_sessions:-0}"
  opencode_detected="${opencode_detected_sessions:-0}"
  total_sessions="$agent_session_detected_count"
  total_batches=0
  if (( total_sessions > 0 )); then
    total_batches=$(( (total_sessions + AGENT_SESSION_BATCH_SIZE - 1) / AGENT_SESSION_BATCH_SIZE ))
  fi
  limit_json="null"
  [[ -n "$AGENT_SESSION_LIMIT" ]] && limit_json="$AGENT_SESSION_LIMIT"
  local offset_json="null"
  [[ -n "$AGENT_SESSION_OFFSET" ]] && offset_json="$AGENT_SESSION_OFFSET"
  save_called="false"
  [[ "$DRY_RUN" -eq 0 && "$agent_session_saved_count" -gt 0 ]] && save_called="true"
  skipped_json="$opencode_skipped_without_sqlite3"
  AGENT_REPORT_JSON="{\"enabled\":$enabled_json,\"dryRun\":$dry_run_json,\"batchSize\":$AGENT_SESSION_BATCH_SIZE,\"totalSessions\":$total_sessions,\"totalBatches\":$total_batches,\"sessionLimit\":$limit_json,\"sessionOffset\":$offset_json,\"batches\":$agent_session_batches_json,\"sources\":{\"claude\":{\"scannedPath\":\"~/.claude/projects/$encoded/*.jsonl\",\"ignoredPath\":\"~/.claude/sessions/*.json\",\"detectedSessions\":$claude_detected,\"blockedSessions\":$agent_session_blocked_count},\"opencode\":{\"scannedPath\":\"~/.local/share/opencode/opencode.db\",\"filter\":\"project.worktree = $REPO_DIR\",\"detectedSessions\":$opencode_detected,\"skippedWithoutSqlite3\":$skipped_json}},\"engramSaveCalled\":$save_called}"
}

agent_session_limit_reached() {
  [[ -n "$AGENT_SESSION_LIMIT" ]] && (( agent_session_detected_count >= AGENT_SESSION_LIMIT ))
}

record_agent_session_batch() {
  local session_number="$agent_session_detected_count"
  local batch_index session_count
  batch_index=$(( (session_number - 1) / AGENT_SESSION_BATCH_SIZE + 1 ))
  session_count=$(( (session_number - 1) % AGENT_SESSION_BATCH_SIZE + 1 ))

  # Recalculamos el plan JSON en cada sesión: simple, determinístico y portable.
  local total_sessions="$agent_session_detected_count" total_batches batch_json="" i start end count comma
  total_batches=$(( (total_sessions + AGENT_SESSION_BATCH_SIZE - 1) / AGENT_SESSION_BATCH_SIZE ))
  for (( i=1; i<=total_batches; i++ )); do
    start=$(( (i - 1) * AGENT_SESSION_BATCH_SIZE + 1 ))
    end=$(( i * AGENT_SESSION_BATCH_SIZE ))
    (( end > total_sessions )) && end="$total_sessions"
    count=$(( end - start + 1 ))
    comma=','
    (( i == total_batches )) && comma=''
    batch_json+="{\"batchIndex\":$i,\"batchSize\":$AGENT_SESSION_BATCH_SIZE,\"sessionCount\":$count,\"startSession\":$start,\"endSession\":$end}$comma"
  done
  agent_session_batches_json="[$batch_json]"
  info "Agent session batch plan: session=$session_number batch=$batch_index batchSession=$session_count batchSize=$AGENT_SESSION_BATCH_SIZE"
}

save_agent_session() {
  local source="$1" session_id="$2" content="$3"
  agent_session_detected_count=$((agent_session_detected_count+1))
  record_agent_session_batch
  if ! secret_scan_text "$source/$session_id" "$content"; then
    agent_session_blocked_count=$((agent_session_blocked_count+1))
    return 40
  fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    # Dry-run de agent_sessions: write_report reporta; no se llama ni ejecuta engram save.
    return 0
  fi

  local content_size
  content_size="$(printf '%s' "$content" | wc -c | tr -d ' ')"
  if (( content_size <= CHUNK_CHAR_LIMIT )); then
    engram save "[agent-session][$source] $session_id" "$content" --type agent_session >/dev/null
    agent_session_saved_count=$((agent_session_saved_count+1))
    return 0
  fi

  local total_chunks chunk_index=1 prev_ref="none" session_hash session_doc_id
  session_hash="$(sha256_of_text "$content")"
  session_doc_id="$(printf '%s' "$source|$session_id|$session_hash" | sha256sum | awk '{print $1}')"
  total_chunks=$(( (content_size + CHUNK_CHAR_LIMIT - 1) / CHUNK_CHAR_LIMIT ))
  info "Chunking automático agent session: $source/$session_id (bytes=$content_size, chunks=$total_chunks)"

  local chunk_dir
  chunk_dir="$(mktemp -d "$REPO_DIR/.engram-agent-session-chunks-tmp-XXXXXX")"
  # split -b garantiza chunks <= CHUNK_CHAR_LIMIT aun si el transcript trae líneas JSON gigantes.
  printf '%s' "$content" | split -b "$CHUNK_CHAR_LIMIT" -d --additional-suffix=.chunk - "$chunk_dir/chunk-"

  while IFS= read -r -d '' chunk_file; do
    [[ -f "$chunk_file" ]] || continue

    local chunk_payload chunk_hash chunk_ref next_ref body
    chunk_payload="$(cat "$chunk_file")"
    chunk_hash="$(sha256_of_file "$chunk_file")"
    chunk_ref="${session_doc_id}:${chunk_index}/${total_chunks}:${chunk_hash}"

    if (( chunk_index < total_chunks )); then
      next_ref="${session_doc_id}:$((chunk_index+1))/${total_chunks}"
    else
      next_ref="none"
    fi

    body="$(cat <<EOF
Origen: agent-session/$source/$session_id

---
migration_mode: agent_session_chunked
agent_source: $source
session_id: $session_id
doc_id: $session_doc_id
chunk_index: $chunk_index
total_chunks: $total_chunks
content_hash: $session_hash
chunk_prev: $prev_ref
chunk_next: $next_ref
---

$chunk_payload
EOF
)"
    engram save "[agent-session][$source][chunk $chunk_index/$total_chunks] $session_id" "$body" --type agent_session >/dev/null
    agent_session_saved_count=$((agent_session_saved_count+1))

    info "Chunk agent session guardado: $source/$session_id [$chunk_index/$total_chunks] doc_id=$session_doc_id"
    prev_ref="$chunk_ref"
    chunk_index=$((chunk_index+1))
  done < <(find "$chunk_dir" -type f -name 'chunk-*.chunk' -print0 | sort -z)

  rm -rf "$chunk_dir" 2>/dev/null || true
}

import_claude_agent_sessions() {
  claude_detected_sessions=0
  local encoded claude_dir ignored_dir
  encoded="$(encoded_worktree)"
  claude_dir="$HOME/.claude/projects/$encoded"
  ignored_dir="$HOME/.claude/sessions"
  info "Claude agent sessions: buscando ~/.claude/projects/$encoded/*.jsonl; ~/.claude/sessions/*.json se ignora por metadata."
  [[ -d "$ignored_dir" ]] && info "Claude metadata ignorada: ~/.claude/sessions/*.json"
  [[ -d "$claude_dir" ]] || return 0

  local file payload rel session_id
  while IFS= read -r -d '' file; do
    agent_session_limit_reached && break
    rel="${file#"$HOME/"}"
    payload="$(printf 'Origen: %s\n\n---\nmigration_mode: agent_session\nagent_source: claude\nsource_path: %s\nworktree: %s\n---\n\n' "$rel" "$rel" "$REPO_DIR"; cat "$file")"
    session_id="$(basename "$file" .jsonl)"
    claude_detected_sessions=$((claude_detected_sessions+1))
    save_agent_session "claude" "$session_id" "$payload"
  done < <(find "$claude_dir" -maxdepth 1 -type f -name '*.jsonl' -print0 | sort -z)
}

import_opencode_agent_sessions() {
  opencode_detected_sessions=0
  local db="$HOME/.local/share/opencode/opencode.db"
  [[ -f "$db" ]] || return 0
  if ! command -v sqlite3 >/dev/null 2>&1; then
    warn "sqlite3 no está disponible; skip/omitir/continuar OpenCode agent sessions sin romper la migración completa."
    opencode_skipped_without_sqlite3=true
    return 0
  fi

  local repo_sql rows sql separator
  repo_sql="$(printf '%s' "$REPO_DIR" | sed "s/'/''/g")"
  separator=$'\t'
  local sql_limit_clause=""
  if [[ -n "$AGENT_SESSION_LIMIT" ]]; then
    local effective_limit=$(( AGENT_SESSION_LIMIT ))
    sql_limit_clause=" LIMIT $effective_limit"
  fi
  local sql_offset_clause=""
  if [[ -n "$AGENT_SESSION_OFFSET" ]] && (( AGENT_SESSION_OFFSET > 0 )); then
    sql_offset_clause=" OFFSET $AGENT_SESSION_OFFSET"
    [[ -z "$sql_limit_clause" ]] && sql_limit_clause=" LIMIT -1"
  fi
  sql="SELECT s.id, s.time_created, COALESCE((SELECT group_concat(om.data, char(30)) FROM (SELECT m.data FROM message m WHERE m.session_id = s.id ORDER BY m.time_created, m.id) om), '') FROM session s JOIN project ON project.id = s.project_id WHERE project.worktree = '$repo_sql' ORDER BY s.time_created${sql_limit_clause}${sql_offset_clause};"
  if ! rows="$(sqlite3 -batch -noheader -separator "$separator" "$db" "$sql" 2>&1)"; then
    warn "No se pudieron leer sesiones OpenCode desde sqlite; se omiten y se continúa: $rows"
    return 0
  fi

  local row session_id created_at body payload
  while IFS= read -r row; do
    [[ -n "$row" ]] || continue
    agent_session_limit_reached && break
    IFS=$'\t' read -r session_id created_at body <<<"$row"
    body="${body//$'\036'/$'\n'}"
    payload="$(printf 'Origen: ~/.local/share/opencode/opencode.db\n\n---\nmigration_mode: agent_session\nagent_source: opencode\nsession_id: %s\ncreated_at: %s\nworktree: %s\n---\n\n%s\n' "$session_id" "$created_at" "$REPO_DIR" "$body")"
    opencode_detected_sessions=$((opencode_detected_sessions+1))
    save_agent_session "opencode" "$session_id" "$payload"
  done <<<"$rows"
}

import_agent_sessions() {
  agent_source_enabled claude && import_claude_agent_sessions
  if ! agent_session_limit_reached; then
    agent_source_enabled opencode && import_opencode_agent_sessions
  fi
  build_agent_sessions_report
}

# Limpiar temporales de ejecuciones anteriores antes de arrancar
cleanup_engram_tempdirs

knowledge_files=()
if [[ -d "$KNOWLEDGE_DIR" ]]; then
  info "Secret-scan previo sobre knowledge/ completo"
  if ! secret_scan; then
    recommendation="Revisá el hallazgo, redactá o eliminá el secreto y decidí explícitamente si corresponde reintentar. No se importó ni subió nada."
    write_report "blocked" "0" "false" "Secret-scan bloqueó la migración por posibles secretos." "$recommendation"
    err "$recommendation"
    exit 40
  fi
  mapfile -d '' knowledge_files < <(find "$KNOWLEDGE_DIR" -type f \( -name '*.md' -o -name '*.txt' -o -name '*.json' -o -name '*.log' \) -print0 | sort -z)
else
  warn "No detecté knowledge/ en '$REPO_DIR'. No hay migración full de knowledge para ejecutar."
fi

if ! import_agent_sessions; then
  build_agent_sessions_report
  recommendation="Revisá/redactá la sesión histórica bloqueada por secret-scan antes de reintentar."
  write_report "blocked" "0" "false" "Secret-scan bloqueó agent sessions Claude/OpenCode por posibles secretos." "$recommendation"
  err "$recommendation"
  exit 40
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  if [[ "$PLAN_AGENT_SESSIONS" -eq 1 ]]; then
    write_report "dry-run" "0" "false" "Plan agent sessions: se detectaron $agent_session_detected_count sesiones en batches de $AGENT_SESSION_BATCH_SIZE; no se importó nada."
  else
    write_report "dry-run" "0" "false" "Se simularía migración completa de ${#knowledge_files[@]} archivos de knowledge/ y $agent_session_detected_count agent sessions a Engram local."
  fi
  ok "Dry-run OK: no se escribió, importó ni borró nada."
  exit 0
fi

if [[ ! -d "$KNOWLEDGE_DIR" ]]; then
  write_report "ok" "$agent_session_saved_count" "false" "Migración OK: agent sessions importadas; no había knowledge/ para eliminar."
  ok "Migración OK. Agent sessions importadas: $agent_session_saved_count."
  exit 0
fi

printf '{"source":"knowledge","target":"engram-local","backupCreated":false,"files":[\n' > "$MANIFEST_FILE"
for index in "${!knowledge_files[@]}"; do
  rel="${knowledge_files[$index]#${REPO_DIR}/}"
  comma=','
  [[ "$index" -eq "$((${#knowledge_files[@]} - 1))" ]] && comma=''
  printf '  "%s"%s\n' "$rel" "$comma" >> "$MANIFEST_FILE"
done
printf ']}\n' >> "$MANIFEST_FILE"
printf '{"status":"running","importedCount":0}\n' > "$TEMP_STATE_FILE"

imported_count=0
migration_batch_id="kbmig-$(date -u +%Y%m%dT%H%M%SZ)-$$"
for file in "${knowledge_files[@]}"; do
  rel="${file#${REPO_DIR}/}"
  save_document_with_chunking "$file" "$rel" "$migration_batch_id"
  imported_count=$((imported_count+1))
  printf '{"status":"running","importedCount":%s,"lastImported":"%s"}\n' "$imported_count" "$rel" > "$TEMP_STATE_FILE"
done

rm -rf "$KNOWLEDGE_DIR"
cleanup_temporaries
write_report "ok" "$((imported_count + agent_session_saved_count))" "true" "Migración completa OK: knowledge/ y agent sessions importados a Engram local; knowledge/ eliminado del proyecto."
ok "Migración completa OK. Archivos importados: $imported_count. Agent sessions importadas: $agent_session_saved_count. knowledge/ fue eliminado."
