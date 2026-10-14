// SPDX-License-Identifier: GPL-2.0-or-later
import fs from 'node:fs';
import assert from 'node:assert/strict';
const filename = process.argv[2];
if (!filename) throw Error('Usage: node scripts/verify-boot.mjs path/to/module.wasm');
const {instance} = await WebAssembly.instantiate(fs.readFileSync(filename));
const e = instance.exports;
assert.equal(e.bw_upstream_version(),50202);
for (const [n,expected] of [[0,0],[1,0x3c00],[1.5,0x3e00],[-2,0xc000]]) assert.equal(e.bw_float_to_half(n),expected);
assert.equal(e.bw_half_to_float(0x3e00),1.5);
assert.equal(e.bw_roundtrip_fp16(-2),-2);
console.log('Blender freestanding C++ WASM boot: PASS');
