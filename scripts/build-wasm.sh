#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-2.0-or-later
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
command -v emcmake >/dev/null || { echo "Activate Emscripten SDK." >&2; exit 1; }
command -v ninja >/dev/null || { echo "Install Ninja." >&2; exit 1; }
test -f "$ROOT/third_party/blender/source/blender/blenlib/intern/math_half.cc" || "$ROOT/scripts/fetch-blender.sh"
emcmake cmake -S "$ROOT" -B "$ROOT/build/wasm" -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build "$ROOT/build/wasm" --parallel
mkdir -p "$ROOT/dist"
cp "$ROOT/web/index.html" "$ROOT/web/main.js" "$ROOT/web/style.css" "$ROOT/web/package.json" "$ROOT/dist/"
echo "WASM browser harness at $ROOT/dist"
