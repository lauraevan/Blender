#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-2.0-or-later
# Host the real browser-native Blender WASM runtime distributed by HeyPuter.
# This is an upstream precompiled 5.3 development build, NOT Blender 5.2.2.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_URL="https://github.com/HeyPuter/blender-wasm/releases/download/1.0.0/blender6.tar.gz"
RELEASE_SHA256="4e26d44734d7838300c9849c0f1d673d6fd0460e826af04e72879afac0cbf0f1"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
echo "Downloading verified HeyPuter Blender/WASM v1.0.0 binary release..."
curl --fail --location --retry 3 --connect-timeout 15 --max-time 240 --silent --show-error \
  "$RELEASE_URL" -o "$WORK/blender6.tar.gz"
printf '%s  %s\n' "$RELEASE_SHA256" "$WORK/blender6.tar.gz" | sha256sum --check --status || {
  echo "Upstream archive SHA-256 mismatch; refusing release" >&2; exit 1;
}
mkdir -p "$ROOT/full-web"
rm -rf "$ROOT/full-web/dist"
# Tarball is published by HeyPuter and checked against a pinned digest.
tar xzf "$WORK/blender6.tar.gz" -C "$ROOT/full-web"
OUT="$ROOT/full-web/dist"
for path in blender.js blender.wasm.zst assets.tar.zst manifest.json index.html; do
  test -s "$OUT/$path" || { echo "Missing real Blender browser asset: $path" >&2; exit 1; }
done
# Keep our separate, clearly-labeled Blender-5.2.2 native core test accessible.
mkdir -p "$OUT/core"
cp "$ROOT/web/index.html" "$ROOT/web/main.js" "$ROOT/web/style.css" "$ROOT/web/package.json" "$ROOT/web/blender_core.js" "$OUT/core/"
echo "Ready: full Blender WASM release at $OUT, bootstrap smoke at /core/"
