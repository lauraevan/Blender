#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-2.0-or-later
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/third_party/blender"
TAG="v5.2.2"
if [[ ! -d "$DEST/.git" ]]; then
  mkdir -p "$ROOT/third_party"
  GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 --single-branch --branch "$TAG" https://github.com/blender/blender.git "$DEST"
fi
git -C "$DEST" checkout --detach "$TAG"
test -f "$DEST/source/blender/blenlib/intern/math_half.cc"
echo "Original Blender source: $(git -C "$DEST" describe --tags --always)"
