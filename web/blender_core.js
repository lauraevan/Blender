// SPDX-License-Identifier: GPL-2.0-or-later
// Precompiled freestanding WASM bootstrap with Blender 5.2.2 scalar math.
// Full Emscripten builds override this file with dist/blender_core.js and .wasm.
const WASM_BASE64 = 'AGFzbQEAAAABFARgAX0Bf2ABfwF9YAF9AX1gAAF/AwUEAAECAwQFAXABAQEFAwEAAgYIAX8BQYCIBAsHWgUGbWVtb3J5AgAQYndfZmxvYXRfdG9faGFsZgAAEGJ3X2hhbGZfdG9fZmxvYXQAARFid19yb3VuZHRyaXBfZnAxNgACE2J3X3Vwc3RyZWFtX3ZlcnNpb24AAwrnAwR4AgF9AX8CQAJAIACLIgG8IgJBgICAvARJDQBBgPwBQYD4ASACQYCAgPwHSxshAgwBCwJAIAJB////wwNLDQAgAUMAAAA/krwhAgwBCyACIAJBDXZBAXFqQf+fgMAAakENdiECCyACQf//A3EgALxBEHZBgIACcXILegEDfyAAQQ10IgFBgMD//wFxIQICQAJAIAFBgICA/ABxIgNBgICA/ABHDQAgAkGAgICAB3IhAQwBCwJAIANFDQAgAUGAwP//AHFBgICAwANqIQEMAQsgAkGAgIDEA3K+QwAAgLiSvCEBCyABIABBEHRBgICAgHhxcr4L6QECAX0EfwJAAkAgAIsiAbwiAkGAgIC8BEkNAEGA/AFBgPgBIAJBgICA/AdLGyECDAELAkAgAkH////DA0sNACABQwAAAD+SvCECDAELIAIgAkENdkEBcWpB/5+AwABqQQ12IQILIAIgALxBEHZBgIACcXIiA0ENdCICQYDA//8BcSEEAkACQCACQYCAgPwAcSIFQYCAgPwARw0AIARBgICAgAdyIQIMAQsCQCAFRQ0AIAJBgMD//wBxQYCAgMADaiECDAELIARBgICAxANyvkMAAIC4krwhAgsgAiADQRB0QYCAgIB4cXK+CwYAQZqIAws=';

export default async function createBlenderCore() {
  const bytes = Uint8Array.from(atob(WASM_BASE64), c => c.charCodeAt(0));
  const {instance} = await WebAssembly.instantiate(bytes);
  const x = instance.exports;
  return {
    _bw_float_to_half: x.bw_float_to_half,
    _bw_half_to_float: x.bw_half_to_float,
    _bw_roundtrip_fp16: x.bw_roundtrip_fp16,
    _bw_upstream_version: x.bw_upstream_version,
  };
}
