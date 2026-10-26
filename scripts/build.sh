#!/usr/bin/env bash
#
# Package the Spoki Odoo module into an importable .zip (Apps > Import Module, or the S3 download).
#
# Usage:
#   ./scripts/build.sh            # builds out/spoki_whatsapp-<version>.zip from __manifest__.py
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MODULE="spoki_whatsapp"
OUT_DIR="$ROOT_DIR/out"

VERSION="$(grep -E '"version"' "$ROOT_DIR/$MODULE/__manifest__.py" | head -1 | sed -E 's/.*"version"[^"]*"([^"]+)".*/\1/')"
ZIP="$OUT_DIR/${MODULE}-${VERSION}.zip"

mkdir -p "$OUT_DIR"
rm -f "$ZIP"
(cd "$ROOT_DIR" && zip -qr "$ZIP" "$MODULE" -x '*/__pycache__/*' '*.pyc' '*.DS_Store' '*/.gitkeep')
echo "Built $ZIP"
