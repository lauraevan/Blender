# Full Blender WebGPU integration

This branch of the project uses two deliberately separate code paths.

## Stable source compiler proof (5.2.2)

`README.md` documents the original Blender `v5.2.2` C++ FP16 module built with CMake/Emscripten. Native C++ tests and the bundled WebAssembly bridge have been run successfully in a Linux environment. They do **not** constitute a Blender application port.

## Experimental full application target (HeyPuter)

`scripts/puter-browser.sh` pins a checked-out copy of [HeyPuter/blender-wasm](https://github.com/HeyPuter/blender-wasm) at commit:

`f8f811929f8a5bc218e04944cf2dff25eeeccbf3`

That upstream build uses its own patched Blender source fork at:

`6b031d3d41c392883e3c495aa72343e10d15b43d`

It is **Blender 5.3 alpha/development source**, not Blender 5.2.2 stable. It is kept under ignored `third_party/puter-blender-wasm/` and is not automatically substituted into the 5.2.2 source tree. Upstream's GPL license and attribution remain intact.

### Quick inspect (tested)

```bash
bash scripts/puter-browser.sh inspect
```

This clones the pinned upstream port, verifies both source revisions, and checks local tool prerequisites. It performs no expensive compilation.

### Full browser build (experimental, unverified end-to-end here)

This route needs substantial memory, disk space, networking and build time. Install Git LFS, Make, CMake, Ninja, Python 3, Node.js/npm, and a native compiler first, on Linux or a compatible development environment.

```bash
bash scripts/puter-browser.sh launch
```

This performs:

1. Fetch HeyPuter's pinned build and patched Blender fork, install its pinned Emscripten SDK.
2. Build dependencies and configure the Blender CMake project.
3. Compile the **Blender** native target to WebAssembly using Ninja.
4. Link the full browser runtime and package CPython/assets via HeyPuter's release linker.
5. Bundle the demo with Vite and run the development host on **http://localhost:8080**.

Separate commands are also available: `inspect`, `prepare`, `build`, `package`, and `serve`.

The upstream Vite server applies `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers needed for WASM pthreads. Deployment must preserve those headers and support the large binary/asset files.

### Validation status

| Check | Result |
| --- | --- |
| Original Blender 5.2.2 C++ native build/tests | Passed in Linux |
| Bundled WebAssembly core ABI smoke in Node | Passed in Linux |
| Pinned HeyPuter source checkout and revision test | Passed in Linux |
| Full HeyPuter build (Blender/CPython/deps/linker) | Not yet completed/verified |
| Working Blender application UI in our deployment | Not yet demonstrated |

**A WebGL cube on our existing Vercel preview is a diagnostic and not Blender's editor.** The successful app acceptance test is: patched Blender WASM initializes, Blender window manager and editor draw frames, input operates actual Blender tools, and a Blender-produced `.blend` file can be opened and saved.

This is a stepping stone towards backporting browser-specific changes to stable 5.2.2, rather than claiming the 5.3 fork is the requested release.
