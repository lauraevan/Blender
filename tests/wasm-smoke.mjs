// SPDX-License-Identifier: GPL-2.0-or-later
import assert from 'node:assert/strict';
import createBlenderCore from '../dist/blender_core.js';
const core = await createBlenderCore();
assert.equal(core._bw_upstream_version(), 50202);
assert.equal(core._bw_float_to_half(0), 0x0000);
assert.equal(core._bw_float_to_half(1), 0x3c00);
assert.equal(core._bw_float_to_half(1.5), 0x3e00);
assert.equal(core._bw_float_to_half(-2), 0xc000);
assert.equal(core._bw_half_to_float(0x3e00), 1.5);
assert.equal(core._bw_roundtrip_fp16(-2), -2);
console.log('Blender 5.2.2 WASM blenlib test PASS');
