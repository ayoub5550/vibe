#!/usr/bin/env bash
# blender_run.sh: the "Blender runner". Runs a Blender Python script headless and deterministically.
# Usage: tools/blender_run.sh <script.py> [-- script args...]
#   e.g. tools/blender_run.sh tools/blender/card_spin.py -- --out projects/x/assets/blender/card --frames 48 --size 384
# - Always: background (-b), factory settings (no user prefs/addons leak in), no audio device.
# - Finds Blender in $BLENDER, then PATH, then ~/opt (tools/install_blender.sh).
# - No GPU here: render with Cycles on CPU (EEVEE/Workbench need an OpenGL context and fail headless).
set -euo pipefail
SCRIPT="$1"; shift
[ "${1:-}" = "--" ] && shift
B="${BLENDER:-}"
[ -z "$B" ] && B=$(command -v blender || true)
[ -z "$B" ] && B=$(ls -d "$HOME"/opt/blender-*/blender 2>/dev/null | tail -1 || true)
if [ -z "$B" ]; then echo "Blender not found: run bash tools/install_blender.sh" >&2; exit 2; fi
exec "$B" -b --factory-startup -noaudio --python-exit-code 1 -P "$SCRIPT" -- "$@"
