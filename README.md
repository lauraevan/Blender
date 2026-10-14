# Blender Web (experimental port)

An in-browser WebAssembly port effort with two separate paths: official **Blender 5.2.2 LTS** native-source compilation, and an experimental full WebGPU application from HeyPuter's **Blender 5.3 development fork**.

This repository builds **real Blender C++ source** into a browser-loadable WASM module. The first milestone extracts Blender's `blenlib` FP16 conversion implementation so we can verify the compiler, ABI, WebAssembly/JavaScript bridge, and browser runtime before attempting the full application.

**Current status:** The 5.2.2 native-core compiler proof is verified. The full experimental 5.3 browser runtime is packaged separately from HeyPuter's published release. A browser test successfully initialized native WASM/WebGPU and emitted a first-content signal, **but the headless software-GPU screenshot was almost completely white**. Interactive editor functionality remains unverified. This is not cloud streaming or a fake UI.

## Run the full experimental Blender browser build

```bash
npm run build
node server/blender-server.mjs
```

Open `http://localhost:8080` in a recent desktop Chrome/Edge with working **hardware WebGPU**. The build fetches a checksum-verified upstream Blender WASM release (~58 MB download), extracts it to `full-dist`, and serves it with the COOP/COEP headers required by WebAssembly threads. It does not rebuild the entire native application from official 5.2.2 sources. See [full launch status](docs/launch-status.md). The native WebAssembly core smoke test remains under `web/`.

To verify more than a WebGPU startup message, install `puppeteer` and `pngjs` locally and run `node tests/full-launch.cjs`. Its screenshot-based white-screen check is deliberately stricter than the upstream first-content indicator.

## Quick start

Install Git, CMake 3.20+, Ninja, Python 3, and [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html). Activate emsdk so `emcmake` and `em++` are on PATH.

```bash
./scripts/fetch-blender.sh
./scripts/build-wasm.sh
python3 -m http.server 8000 --directory dist
```

Visit http://localhost:8000. The build produces `dist/blender_core.js` and `dist/blender_core.wasm`. It embeds code compiled from the Blender source checkout, with a minimal diagnostic page to prove the native code is running in the browser.

For native smoke checks (without Emscripten):

```bash
./scripts/test-native.sh
```

## Source and license

The upstream code is pulled unchanged from the official [Blender](https://projects.blender.org/blender/blender) release tag `v5.2.2`, and remains copyright its respective authors under GPL-2.0-or-later. The bridge and support code in this repo is GPL-2.0-or-later as well. Upstream source is not vendored into this initial foundation commit. See [COPYING](COPYING).

## Port stages

1. **WASM toolchain:** compile and execute actual Blender math routines in a web browser (this repository).
2. **Blender data layer:** portable Blend-file loading, DNA/RNA and internal memory/data dependencies.
3. **Geometry and scene graph:** BMesh, mesh operators, modifiers, scene state.
4. **GPU and windowing:** browser WebGPU/WebGL2 backend, event loop, input, and UI abstraction.
5. **Runtime:** embedded Python, file APIs, background processing, render integration.

A working HTML page that invokes a native utility function is a toolchain proof, not completion of stages 2–5.

## Experimental full Blender/WebGPU build

We've integrated [HeyPuter/blender-wasm](https://github.com/HeyPuter/blender-wasm) as a **pinned external build dependency** so we can tackle the actual Blender application instead of just a standalone WASM math demo. Unlike our `v5.2.2` stable source target, its patched fork currently uses Blender 5.3 development sources.

Run `bash scripts/puter-browser.sh inspect` to check and fetch the pinned source. When equipped with a full Emscripten toolchain and enough disk/memory, run `bash scripts/puter-browser.sh launch` to attempt building, packaging, and serving the full Blender application. This full application build is **not yet validated**. See [the complete architecture and validation status](docs/full-webgpu-port.md).
