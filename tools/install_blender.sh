#!/usr/bin/env bash
# install_blender.sh: install Blender 4.2 LTS (headless-capable, no root needed) into ~/opt.
# Usage: bash tools/install_blender.sh        (idempotent; ~20 s: 352 MB download + extract)
# Afterwards: tools/blender_run.sh finds it automatically, or export BLENDER=~/opt/blender-4.2.3-linux-x64/blender
# /opt is not writable for the sandbox user, so this installs under $HOME and the sandbox loses it on reset.
# Re-run it at the start of every session that needs Blender.
set -euo pipefail
VER=4.2.3
DIR="$HOME/opt/blender-$VER-linux-x64"
if [ -x "$DIR/blender" ]; then echo "blender already at $DIR"; "$DIR/blender" -b --version 2>/dev/null | head -1; exit 0; fi
mkdir -p "$HOME/opt"
TMP=$(mktemp -d)
curl -sSL -o "$TMP/b.tar.xz" "https://download.blender.org/release/Blender4.2/blender-$VER-linux-x64.tar.xz"
tar -xJf "$TMP/b.tar.xz" -C "$HOME/opt"
rm -rf "$TMP"
"$DIR/blender" -b --version 2>/dev/null | head -1
echo "installed: $DIR/blender"
