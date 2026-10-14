// SPDX-License-Identifier: GPL-2.0-or-later
import assert from 'node:assert/strict';
import createBlenderCore from '../web/blender_core.js';
const core = await createBlenderCore();
assert.equal(core._bw_upstream_version(), 50202);
for(const [n,expected] of [[0,0],[1,0x3c00],[1.5,0x3e00],[-2,0xc000]]) assert.equal(core._bw_float_to_half(n),expected);
assert.equal(core._bw_half_to_float(0x3e00),1.5);
assert.equal(core._bw_roundtrip_fp16(-2),-2);
console.log('Bundled boot WASM loads and computes: PASS');
