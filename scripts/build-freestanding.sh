#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-2.0-or-later
# Build fallback: independent of Emscripten, using LLVM's wasm32 target.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
command -v clang++ >/dev/null || { echo 'Need clang++ with wasm32 and wasm-ld' >&2; exit 1; }
mkdir -p "$ROOT/build"
clang++ --target=wasm32 -std=c++20 -O2 -nostdlib -fno-exceptions -fno-rtti \
  -Wl,--no-entry -Wl,--export=bw_float_to_half \
  -Wl,--export=bw_half_to_float -Wl,--export=bw_roundtrip_fp16 \
  -Wl,--export=bw_upstream_version -Wl,--strip-all \
  -o "$ROOT/build/blender_core_boot.wasm" "$ROOT/src/freestanding/math_half_boot.cpp"
node "$ROOT/scripts/verify-boot.mjs" "$ROOT/build/blender_core_boot.wasm"
