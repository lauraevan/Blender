# Browser port architecture (Blender 5.2.2)

## Status and invariant

All genuine Blender components must be compiled from the official `v5.2.2` source.
Web-specific adapters live separately in this repository. The current WebGL2
viewport is a native/WASM integration test, **not** the Blender editor.
No streaming, remote desktop, or embedded native-window wrapper.

## Dependency and migration plan

| Layer | Blender code | Browser blocker | Port strategy |
| --- | --- | --- | --- |
| Build | Top-level CMake, external libraries | Native platform/toolchain assumptions | Isolate native host code generators; compile portable libraries with Emscripten |
| Math and memory | `blenlib`, `guardedalloc` | SIMD and allocation ABI | Port/test one library at a time (first: `math_half.cc`) |
| File formats | `makesdna`, `blendfile`, `makesrna` | Host file APIs and generated headers | Run host code generators on the build machine; use browser File API + virtual FS |
| Scene graph | `blenkernel`, `bmesh`, `modifiers` | Dependencies on unavailable services | Introduce a headless scene/mesh API, then build unit tests with genuine .blend fixtures |
| Rendering | `gpu`, EEVEE, Cycles | No direct Vulkan/OpenGL desktop context | Implement browser WebGPU/GPU abstractions; keep CPU rendering as a separate target |
| Windows/input | `ghost`, `windowmanager` | Browser has no OS windows or native event queue | Map canvas, pointer/keyboard, resize, clipboard, and frame scheduling |
| Python | `bpy`, embedded CPython | Native OS modules and dynamic libraries | Emscripten-compatible Python runtime with controlled module availability |
| Concurrency | TBB, task schedulers | Worker restrictions, shared-memory headers | Evaluate pthreads + COOP/COEP, fall back where feasible |

## Milestones with measurable acceptance

1. **Core ABI:** compiling original Blender code produces browser-loadable WASM;
   FP16 native and Node WASM tests pass. An interactive browser WebGL2 viewport
   consumes the half-float mesh data emitted by the native WASM bridge.
2. **Data format:** use Blender's own DNA and blendfile libraries to open a
   simple version-matched `.blend` fixture in-memory with no native disk access.
3. **Scene:** enumerate objects, transform a mesh, serialize changes; compare
   results against native Blender on the same fixture.
4. **UI:** adapt actual Blender WM/GHOST/Editors code for canvas input and
   GPU backend. Only then claim that native Blender UI is running in-browser.
5. **Renderer:** achieve reproducible CPU renders, then progressively support
   viewport GPU features, materials, and EEVEE where browser GPU APIs permit.

## Browser hosting requirements

This initial no-threads/no-filesystem smoke module can be hosted from an ordinary
static HTTP server. A threaded future module must be served with
`Cross-Origin-Opener-Policy: same-origin` and
`Cross-Origin-Embedder-Policy: require-corp` (or compatible isolation),
plus correctly configured asset MIME types and cross-origin permissions.

## Running and testing

Run `./scripts/fetch-blender.sh`, `./scripts/test-native.sh`,
`./scripts/build-wasm.sh`, then `node tests/wasm-smoke.mjs`.
Use `python3 -m http.server 8000 --directory dist` for the browser
harness and verify the canvas/test panel rather than assuming build success.

The full renderer, modifiers, Python API, .blend loading, UI, and sculpt mode are
**not** implemented in milestone 1.
