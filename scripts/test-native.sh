#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-2.0-or-later
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
test -f "$ROOT/third_party/blender/source/blender/blenlib/intern/math_half.cc" || "$ROOT/scripts/fetch-blender.sh"
cmake -S "$ROOT" -B "$ROOT/build/native" -G Ninja -DCMAKE_BUILD_TYPE=Debug
cmake --build "$ROOT/build/native" --parallel
ctest --test-dir "$ROOT/build/native" --output-on-failure
