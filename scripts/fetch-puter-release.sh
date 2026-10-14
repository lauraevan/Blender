#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-2.0-or-later
# Repackage HeyPuter's publicly released Blender WASM browser app.
# This is the upstream prebuilt 5.3-development binary, not a local 5.2.2 rebuild.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/full-dist"
if [[ $# -gt 0 ]]; then OUT="$1"; fi
ASSET_URL="https://github.com/HeyPuter/blender-wasm/releases/download/1.0.0/blender6.tar.gz"
EXPECTED="4e26d44734d7838300c9849c0f1d673d6fd0460e826af04e72879afac0cbf0f1"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
command -v curl >/dev/null || { echo "curl is required" >&2; exit 1; }
command -v sha256sum >/dev/null || { echo "sha256sum is required" >&2; exit 1; }
curl -fLSs --retry 3 "$ASSET_URL" -o "$TMP/blender6.tar.gz"
printf '%s  %s\n' "$EXPECTED" "$TMP/blender6.tar.gz" | sha256sum -c -
tar -xzf "$TMP/blender6.tar.gz" -C "$TMP"
test -s "$TMP/dist/blender.wasm.zst"
test -s "$TMP/dist/assets.tar.zst"
test -s "$TMP/dist/blender.js"
test -s "$TMP/dist/index.html"
mkdir -p "$OUT"
cp -a "$TMP/dist/." "$OUT/"
echo "Bundled upstream Blender WASM release at: $OUT"
echo "This is an unmodified HeyPuter binary distribution (version 1.0.0)."
