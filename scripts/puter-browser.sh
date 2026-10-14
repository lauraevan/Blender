#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-2.0-or-later
# Experimental full Blender app browser build using the HeyPuter WebGPU port.
# This uses a 5.3 development fork, NOT our 5.2.2 stable core.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/third_party/puter-blender-wasm"
PORT_URL="https://github.com/HeyPuter/blender-wasm.git"
PORT_REV="f8f811929f8a5bc218e04944cf2dff25eeeccbf3"
BLENDER_FORK_REV="6b031d3d41c392883e3c495aa72343e10d15b43d"
MODE="${1:-inspect}"

usage() {
  printf 'Usage: %s {inspect|prepare|build|package|serve|launch}\n' "$0"
  printf '  inspect: pinned source and toolchain preflight only\n'
  printf '  prepare: download port and its full native build prerequisites\n'
  printf '  build: compile full Blender WASM and package browser assets\n'
  printf '  package: bundle already compiled Blender WASM with demo frontend\n'
  printf '  serve: serve compiled browser app at localhost:8080\n'
  printf '  launch: prepare, build, package and serve\n'
}

checkout_port() {
  command -v git >/dev/null || { echo 'Git is required' >&2; exit 1; }
  if [[ ! -d "$DEST/.git" ]]; then
    mkdir -p "$(dirname "$DEST")"
    git clone --depth 1 --filter=blob:none "$PORT_URL" "$DEST"
  fi
  if [[ "$(git -C "$DEST" rev-parse HEAD)" != "$PORT_REV" ]]; then
    git -C "$DEST" fetch --depth 1 origin "$PORT_REV"
    git -C "$DEST" checkout --detach "$PORT_REV"
  fi
  [[ "$(git -C "$DEST" rev-parse HEAD)" == "$PORT_REV" ]] || {
    echo "Pinned HeyPuter revision mismatch" >&2; exit 1;
  }
  [[ -f "$DEST/scripts/link_blender_release.sh" ]] || {
    echo "Browser release script missing in pinned port" >&2; exit 1;
  }
  grep -Fq "$BLENDER_FORK_REV" "$DEST/Makefile" || {
    echo "Pinned Blender fork changed unexpectedly" >&2; exit 1;
  }
  echo "HeyPuter WASM port pinned: $PORT_REV"
  echo "Blender development fork:  $BLENDER_FORK_REV"
}

inspect() {
  checkout_port
  echo 'Experimental full Blender browser build (WebGPU), 5.3 development source.'
  echo 'Our official 5.2.2 stable source integration stays separate.'
  echo 'Full build needs substantial disk space, RAM, and a long native toolchain build.'
  echo 'The browser will require cross-origin isolation for SharedArrayBuffer.'
  for bin in git git-lfs make cmake ninja python3 node npm; do
    if command -v "$bin" >/dev/null 2>&1; then
      printf '[ok] %s\n' "$bin"
    else
      printf '[missing] %s\n' "$bin"
    fi
  done
}

prepare() {
  checkout_port
  for bin in make cmake ninja git-lfs; do
    command -v "$bin" >/dev/null || { echo "Install $bin" >&2; exit 1; }
  done
  echo 'Preparing pinned Emscripten SDK and patched Blender fork...'
  make -C "$DEST" all
}

build() {
  prepare
  echo 'Compiling dependencies, Python, shaders, and configuring Blender...'
  make -C "$DEST" configure-blender
  echo 'Compiling full Blender binary to WebAssembly...'
  ninja -C "$DEST/build-blender" blender
  echo 'Linking browser runtime, datafiles, and WebGPU assets...'
  (cd "$DEST" && bash scripts/link_blender_release.sh)
}

package() {
  checkout_port
  [[ -f "$DEST/demo/public/blender.js" && -f "$DEST/demo/public/blender.wasm.zst" ]] || {
    echo "Full Blender WASM is absent. Run '$0 build' first." >&2; exit 1;
  }
  command -v npm >/dev/null || { echo 'Install Node.js/npm' >&2; exit 1; }
  (cd "$DEST/demo" && npm ci && npm run build)
  echo "Bundled browser app: $DEST/demo/dist"
  echo "Serve with COOP/COEP headers to allow WebAssembly pthreads."
}

serve() {
  checkout_port
  [[ -f "$DEST/demo/public/blender.wasm.zst" ]] || {
    echo "Compiled Blender WASM is absent. Run '$0 build' first." >&2; exit 1;
  }
  command -v npm >/dev/null || { echo 'Install Node.js/npm' >&2; exit 1; }
  (cd "$DEST/demo" && { [[ -d node_modules ]] || npm ci; } && npm run dev -- --host 0.0.0.0 --port 8080)
}

case "$MODE" in
  inspect) inspect ;;
  prepare) prepare ;;
  build) build ;;
  package) package ;;
  serve) serve ;;
  launch) build; package; serve ;;
  -h|--help|help) usage ;;
  *) usage >&2; exit 2 ;;
esac
