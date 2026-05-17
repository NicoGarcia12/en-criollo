#!/usr/bin/env bash
set -euo pipefail

# engram-push (strict)
# sync local => repo, con prechecks estrictos de git, switch principal y commit final.
# Si hay TTY, el commit es asistido; si no hay TTY, usa default para no bloquear CI.

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info(){ echo -e "${BLUE}[INFO]${NC} $1"; }
ok(){ echo -e "${GREEN}[OK]${NC} $1"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $1"; }
err(){ echo -e "${RED}[ERROR]${NC} $1"; }

REPO_DIR="${AGENTES_IA_REPO_DIR:-$(pwd)}"
LOCAL_ENGRAM_DIR="${ENGRAM_LOCAL_DIR:-$HOME/.engram}"
REPO_ENGRAM_DIR="$REPO_DIR/engram"
PRIMARY_CANDIDATES="${ENGRAM_PRIMARY_BRANCHES:-main master}"

[[ -d "$REPO_DIR/.git" ]] || { err "REPO_DIR no apunta a repo git: $REPO_DIR"; exit 20; }
[[ -d "$LOCAL_ENGRAM_DIR" ]] || { err "No existe ENGRAM local: $LOCAL_ENGRAM_DIR"; exit 21; }

is_dirty() {
  [[ -n "$(git -C "$REPO_DIR" status --porcelain)" ]]
}

choose_commit_message() {
  local primary="chore(engram): sincronizar memoria local al repo"
  local alternative="docs(engram): actualizar snapshot de memoria operativa"
  local english_primary="chore(engram): sync local memory to repo"
  local english_alternative="docs(engram): update operational memory snapshot"

  if [[ ! -t 0 ]]; then
    printf '%s' "$english_primary"
    return 0
  fi

  info "Mensaje de commit propuesto:" >&2
  printf '  1) %s\n' "$primary" >&2
  printf '  2) %s\n' "$alternative" >&2
  printf 'Elegí 1, 2 o escribí otro mensaje: ' >&2
  read -r selected

  local message
  case "$selected" in
    1|'') message="$primary" ;;
    2) message="$alternative" ;;
    *) message="$selected" ;;
  esac

  printf '¿Querés usarlo en inglés? [s/N]: ' >&2
  read -r translate
  if [[ "$translate" =~ ^[sSyY]$ ]]; then
    case "$message" in
      "$primary") message="$english_primary" ;;
      "$alternative") message="$english_alternative" ;;
      *) warn "No hay traductor automático para mensajes libres; se usa el texto tal como lo escribiste." >&2 ;;
    esac
  fi

  printf '%s' "$message"
}

current_branch="$(git -C "$REPO_DIR" branch --show-current)"

resolve_primary() {
  for b in $PRIMARY_CANDIDATES; do
    if git -C "$REPO_DIR" rev-parse --verify "$b" >/dev/null 2>&1; then
      echo "$b"; return 0
    fi
  done
  err "No encontré rama principal entre: $PRIMARY_CANDIDATES"
  exit 22
}

primary="$(resolve_primary)"

if is_dirty; then
  err "Precheck estricto: worktree/staging sucio en agentes-ia. Resolvelo antes de engram-push."
  exit 23
fi

if [[ "$current_branch" != "$primary" ]]; then
  info "switch a rama principal: $primary"
  git -C "$REPO_DIR" switch "$primary"
fi

if [[ -n "$(git -C "$REPO_DIR" rev-list --count @{u}..HEAD 2>/dev/null || true)" ]] && [[ "$(git -C "$REPO_DIR" rev-list --count @{u}..HEAD 2>/dev/null || echo 0)" != "0" ]]; then
  info "Hay commits pendientes: push automático"
  git -C "$REPO_DIR" push
fi

mkdir -p "$REPO_ENGRAM_DIR"
info "sync local => repo ($LOCAL_ENGRAM_DIR -> $REPO_ENGRAM_DIR)"
cp -R "$LOCAL_ENGRAM_DIR"/. "$REPO_ENGRAM_DIR"/

if [[ -z "$(git -C "$REPO_DIR" status --porcelain "$REPO_ENGRAM_DIR")" ]]; then
  ok "Sin cambios de archivos en repo/engram."
  exit 0
fi

git -C "$REPO_DIR" add "$REPO_ENGRAM_DIR"
commit_message="$(choose_commit_message)"
git -C "$REPO_DIR" commit -m "$commit_message"
ok "engram-push OK (commit creado en rama principal)."
