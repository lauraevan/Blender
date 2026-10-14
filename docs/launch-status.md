# Blender browser launch status

Last verified: October 13–14, 2026.

## Sources

- Official stable Blender 5.2.2 tag: https://projects.blender.org/blender/blender
- Full experimental WebGPU port: https://github.com/HeyPuter/blender-wasm
- Full runtime release archive: https://github.com/HeyPuter/blender-wasm/releases/download/1.0.0/blender6.tar.gz
- Release archive SHA-256: `4e26d44734d7838300c9849c0f1d673d6fd0460e826af04e72879afac0cbf0f1`

**Do not confuse these builds:** the small WASM math-core example compiles
unmodified Blender **5.2.2** source. The full browser-application binary
comes from a separately maintained Blender **5.3 development** fork. No
claim is made that the full binary was reproducibly rebuilt in this repo.

## Reproduce the local full-runtime launch

Requirements: Git, Node.js 20+, curl, tar, sha256sum, and a recent desktop
Chrome or Edge with WebGPU enabled and preferably hardware acceleration.

```bash
git clone https://github.com/lauraevan/Blender.git
cd Blender
npm run build
node server/blender-server.mjs
```

The private repository requires an account with access to clone. Open
`http://localhost:8080`, allow the release to download/decompress in the
browser, and click **Launch Blender**. On a software GPU, acknowledge its
slow-rendering warning. `server/blender-server.mjs` serves byte ranges and
sets `Cross-Origin-Opener-Policy: same-origin`,
`Cross-Origin-Embedder-Policy: require-corp` and
`Cross-Origin-Resource-Policy: same-origin`.

For a visible-launch regression test:

```bash
npm install --no-save puppeteer pngjs
BLENDER_URL=http://localhost:8080 node tests/full-launch.cjs
```

This test asserts that Blender fetched and compiled WebAssembly, obtained a
WebGPU device, presented its native first-content signal, and that the
post-launch screenshot is **not** mostly white. It records a screenshot under
`test-artifacts/`.

## Observed behavior

| Test | Result |
| --- | --- |
| Official Blender 5.2.2 `math_half.cc` native C++ compile/tests | PASS |
| Bundled WASM FP16 smoke in Node | PASS |
| HeyPuter runtime archive checksum and integrity | PASS |
| Full release HTTP assets (entry, JS, `.wasm.zst`, `.tar.zst`, manifest) | PASS |
| Real WebGPU device acquisition in headless Chromium/SwiftShader | PASS |
| WebAssembly application runs native graphics loop, first-content marker | PASS |
| Real editor visible in headless screenshot | **NOT PASS**: 99.87% white |
| Editor input, modeling, opening and saving projects | NOT VERIFIED |
| Full official stable 5.2.2 GUI port | NOT IMPLEMENTED |

A log also reported a missing optional Python `_multiprocessing` module
while importing the online asset-library downloader. Rendering behavior on a
hardware WebGPU device has not been independently evaluated.

## Hosting

The release was uploaded to a temporary Vercel URL for browser testing.
**Anonymous deployments expire**. Do not commit the temporary URL as a
permanent release.

A permanent Render web service `blender-web-native` was created at
`https://blender-web-native.onrender.com`, using the repository's verified
release fetch script and isolation-aware Node server. Its **initial build
was canceled due to exhausted Render build minutes**; the URL cannot be
considered running. It is on Render's free service plan with auto deploy
enabled, and will still need a successful build and runtime checks.

A normal permanent Vercel Git deployment would use the included
`vercel.json` and `npm run build`, but the connected team's Git integration
returned 403 during setup. The user needs to restore the Vercel team's
repository access, or restore Render build minutes, for a durable public
deployment.

The next technical goal is a **non-white native Blender editor screenshot**
on supported hardware WebGPU, followed by actual modeling and
`.blend` round-trip acceptance tests. Do not substitute the standalone
WebGL cube proof for these criteria.
