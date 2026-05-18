#!/usr/bin/env bash
set -euo pipefail

# engram-export-all (migración final)
# - Migra TODO knowledge/ a Engram local.
# - No crea backup: la regla final exige migración directa y controlada.
# - Ejecuta secret-scan antes de importar cualquier cosa.
# - En --dry-run no escribe, no importa y no borra.
# - En ejecución real crea manifest/estado temporal y los borra si termina OK.
# - Por defecto muestra el reporte JSON por consola; --report-file <path> lo guarda explícitamente.

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info(){ printf "%b[INFO]%b %s\n" "$BLUE" "$NC" "$1"; }
ok(){ printf "%b[OK]%b %s\n" "$GREEN" "$NC" "$1"; }
warn(){ printf "%b[WARN]%b %s\n" "$YELLOW" "$NC" "$1"; }
err(){ printf "%b[ERROR]%b %s\n" "$RED" "$NC" "$1"; }

DRY_RUN=0
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
    *) err "Argumento no soportado: $1"; exit 2 ;;
  esac
done

if [[ "$DRY_RUN" -eq 0 ]] && ! command -v engram >/dev/null 2>&1; then
  err "No encontré 'engram' en PATH. Instalalo primero."
  exit 10
fi

REPO_DIR="${AGENTES_IA_REPO_DIR:-$(pwd)}"
KNOWLEDGE_DIR="$REPO_DIR/knowledge"
MANIFEST_FILE="$REPO_DIR/.engram-migration-manifest.json"
TEMP_STATE_FILE="$REPO_DIR/.engram-migration-state.json"

if [[ ! -d "$KNOWLEDGE_DIR" ]]; then
  warn "No detecté knowledge/ en '$REPO_DIR'. No hay migración full para ejecutar."
  exit 0
fi

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
  report+="\n}"

  printf '%b\n' "$report"
  if [[ -n "$REPORT_FILE" ]]; then
    printf '%b\n' "$report" > "$REPORT_FILE"
  fi
}

cleanup_temporaries() {
  rm -f "$MANIFEST_FILE" "$TEMP_STATE_FILE"
}

on_error() {
  local exit_code=$?
  write_report "error" "${imported_count:-0}" "false" "Migración interrumpida con exit code $exit_code. knowledge/ no fue borrado." || true
  exit "$exit_code"
}
trap on_error ERR

secret_scan() {
  local findings=0
  while IFS= read -r -d '' file; do
    while IFS=: read -r line text; do
      [[ -z "${line:-}" ]] && continue
      warn "Posible secreto: ${file#${REPO_DIR}/}:$line"
      warn "Extracto: ${text:0:120}"
      findings=$((findings+1))
    done < <(grep -nE '(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9_]{20,}|sk_live_[A-Za-z0-9_\-]{12,}|-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----|[A-Za-z0-9_]*SECRET[A-Za-z0-9_]*[[:space:]]*=[[:space:]]*[^[:space:]]+|[A-Za-z0-9_]*TOKEN[A-Za-z0-9_]*[[:space:]]*=[[:space:]]*[^[:space:]]+)' "$file" 2>/dev/null || true)
  done < <(find "$KNOWLEDGE_DIR" -type f -print0)
  [[ "$findings" -eq 0 ]]
}

info "Secret-scan previo sobre knowledge/ completo"
if ! secret_scan; then
  recommendation="Revisá el hallazgo, redactá o eliminá el secreto y decidí explícitamente si corresponde reintentar. No se importó ni subió nada."
  write_report "blocked" "0" "false" "Secret-scan bloqueó la migración por posibles secretos." "$recommendation"
  err "$recommendation"
  exit 40
fi

mapfile -d '' knowledge_files < <(find "$KNOWLEDGE_DIR" -type f \( -name '*.md' -o -name '*.txt' -o -name '*.json' -o -name '*.log' \) -print0 | sort -z)

if [[ "$DRY_RUN" -eq 1 ]]; then
  write_report "dry-run" "0" "false" "Se simularía migración completa de ${#knowledge_files[@]} archivos de knowledge/ a Engram local."
  ok "Dry-run OK: no se escribió, importó ni borró nada."
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
for file in "${knowledge_files[@]}"; do
  rel="${file#${REPO_DIR}/}"
  body="$(printf 'Origen: %s\n\n' "$rel"; cat "$file")"
  engram save "[knowledge-migration] $rel" "$body" --type knowledge >/dev/null
  imported_count=$((imported_count+1))
  printf '{"status":"running","importedCount":%s,"lastImported":"%s"}\n' "$imported_count" "$rel" > "$TEMP_STATE_FILE"
done

rm -rf "$KNOWLEDGE_DIR"
cleanup_temporaries
write_report "ok" "$imported_count" "true" "Migración completa OK: knowledge/ importado a Engram local y eliminado del proyecto."
ok "Migración completa OK. Archivos importados: $imported_count. knowledge/ fue eliminado."
