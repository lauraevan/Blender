/* SPDX-License-Identifier: GPL-2.0-or-later */
#include <cstdint>
#include "BLI_math_half.hh"
#ifdef __EMSCRIPTEN__
#  include <emscripten/emscripten.h>
#  define BW_EXPORT EMSCRIPTEN_KEEPALIVE
#else
#  define BW_EXPORT
#endif
extern "C" {
BW_EXPORT uint32_t bw_float_to_half(float v) { return blender::math::float_to_half(v); }
BW_EXPORT float bw_half_to_float(uint32_t bits) { return blender::math::half_to_float(uint16_t(bits)); }
BW_EXPORT float bw_roundtrip_fp16(float v) { return blender::math::half_to_float(blender::math::float_to_half(v)); }
BW_EXPORT uint32_t bw_upstream_version() { return 50202; }
}
