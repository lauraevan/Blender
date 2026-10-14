/* SPDX-FileCopyrightText: 2024 Blender Authors
 * SPDX-License-Identifier: GPL-2.0-or-later
 * Scalar float/half functions from Blender 5.2.2 blenlib/intern/math_half.cc,
 * minimally made freestanding for a zero-dependency boot WASM binary.
 */
using uint16_t = unsigned short;
using uint32_t = unsigned int;
namespace blender::math {
uint16_t float_to_half(float v) {
  union FP32 { uint32_t u; float f; };
  FP32 f;
  f.f = v;
  FP32 f32infty = {255 << 23};
  FP32 f16max = {(127 + 16) << 23};
  FP32 denorm_magic = {((127 - 15) + (23 - 10) + 1) << 23};
  uint32_t sign_mask = 0x80000000u;
  uint16_t o = {0};
  uint32_t sign = f.u & sign_mask;
  f.u ^= sign;
  if (f.u >= f16max.u) {
    o = (f.u > f32infty.u) ? 0x7e00 : 0x7c00;
  }
  else {
    if (f.u < (113 << 23)) {
      f.f += denorm_magic.f;
      o = f.u - denorm_magic.u;
    }
    else {
      uint32_t mant_odd = (f.u >> 13) & 1;
      f.u += (uint32_t(15 - 127) << 23) + 0xfff;
      f.u += mant_odd;
      o = f.u >> 13;
    }
  }
  o |= sign >> 16;
  return o;
}
float half_to_float(uint16_t v) {
  union FP32 { uint32_t u; float f; };
  constexpr FP32 magic = {113 << 23};
  constexpr uint32_t shifted_exp = 0x7c00 << 13;
  FP32 o;
  o.u = (v & 0x7fff) << 13;
  uint32_t exp = shifted_exp & o.u;
  o.u += (127 - 15) << 23;
  if (exp == shifted_exp) {
    o.u += (128 - 16) << 23;
  }
  else if (exp == 0) {
    o.u += 1 << 23;
    o.f -= magic.f;
  }
  o.u |= (v & 0x8000) << 16;
  return o.f;
}
}
extern "C" {
__attribute__((used, visibility("default"))) uint32_t bw_float_to_half(float v) { return blender::math::float_to_half(v); }
__attribute__((used, visibility("default"))) float bw_half_to_float(uint32_t v) { return blender::math::half_to_float(uint16_t(v)); }
__attribute__((used, visibility("default"))) float bw_roundtrip_fp16(float v) { return blender::math::half_to_float(blender::math::float_to_half(v)); }
__attribute__((used, visibility("default"))) uint32_t bw_upstream_version() { return 50202; }
}
