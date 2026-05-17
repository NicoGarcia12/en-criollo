#!/usr/bin/env bash
set -euo pipefail

# Setup reproducible para otra compu (bash)
# deja variables y scripts listos para engram local + sync con repo agentes-ia

TARGET_BIN_DIR="${ENGRAM_BIN_DIR:-$HOME/.local/bin}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$TARGET_BIN_DIR"

install -m 755 "$SCRIPT_DIR/engram-export-all.sh" "$TARGET_BIN_DIR/engram-export-all"
install -m 755 "$SCRIPT_DIR/engram-push.sh" "$TARGET_BIN_DIR/engram-push"
install -m 755 "$SCRIPT_DIR/engram-pull.sh" "$TARGET_BIN_DIR/engram-pull"

echo "[OK] Wrappers instalados en $TARGET_BIN_DIR"
echo "Exportá variables recomendadas:"
echo "  export AGENTES_IA_REPO_DIR=\"<ruta-agentes-ia>\""
echo "  export ENGRAM_LOCAL_DIR=\"$HOME/.engram\""
echo "  export ENGRAM_PRIMARY_BRANCHES=\"main master\""
