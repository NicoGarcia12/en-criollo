#!/usr/bin/env bash
set -euo pipefail

# engram-pull (strict)
# sync repo => local, con prechecks estrictos + push de pending commits si existe

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info(){ echo -e "${BLUE}[INFO]${NC} $1"; }
ok(){ echo -e "${GREEN}[OK]${NC} $1"; }
err(){ echo -e "${RED}[ERROR]${NC} $1"; }

REPO_DIR="${AGENTES_IA_REPO_DIR:-$(pwd)}"
LOCAL_ENGRAM_DIR="${ENGRAM_LOCAL_DIR:-$HOME/.engram}"
REPO_ENGRAM_DIR="$REPO_DIR/engram"
PRIMARY_CANDIDATES="${ENGRAM_PRIMARY_BRANCHES:-main master}"

[[ -d "$REPO_DIR/.git" ]] || { err "REPO_DIR no apunta a repo git: $REPO_DIR"; exit 30; }
[[ -d "$REPO_ENGRAM_DIR" ]] || { err "No existe engram/ dentro del repo: $REPO_ENGRAM_DIR"; exit 31; }

resolve_primary() {
  for b in $PRIMARY_CANDIDATES; do
    if git -C "$REPO_DIR" rev-parse --verify "$b" >/dev/null 2>&1; then
      echo "$b"; return 0
    fi
  done
  err "No encontré rama principal entre: $PRIMARY_CANDIDATES"
  exit 32
}

if [[ -n "$(git -C "$REPO_DIR" status --porcelain)" ]]; then
  err "Precheck estricto: cambios locales detectados. Terminá/commiteá antes de engram-pull."
  exit 33
fi

primary="$(resolve_primary)"
current_branch="$(git -C "$REPO_DIR" branch --show-current)"
if [[ "$current_branch" != "$primary" ]]; then
  info "switch a principal: $primary"
  git -C "$REPO_DIR" switch "$primary"
fi

pending="$(git -C "$REPO_DIR" rev-list --count @{u}..HEAD 2>/dev/null || echo 0)"
if [[ "$pending" != "0" ]]; then
  info "Hay commits pending para push: se pushean antes del pull"
  git -C "$REPO_DIR" push
fi

info "pull en rama principal"
git -C "$REPO_DIR" pull --ff-only

mkdir -p "$LOCAL_ENGRAM_DIR"
info "sync repo => local ($REPO_ENGRAM_DIR -> $LOCAL_ENGRAM_DIR)"
cp -R "$REPO_ENGRAM_DIR"/. "$LOCAL_ENGRAM_DIR"/

ok "engram-pull OK"
