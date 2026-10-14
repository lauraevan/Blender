/* SPDX-License-Identifier: GPL-2.0-or-later */
#include <cassert>
#include <cmath>
#include <cstdint>
#include <limits>
#include <iostream>
extern "C" uint32_t bw_float_to_half(float);
extern "C" float bw_half_to_float(uint32_t);
extern "C" float bw_roundtrip_fp16(float);
extern "C" uint32_t bw_upstream_version();
int main() {
  assert(bw_upstream_version()==50202);
  assert(bw_float_to_half(0.0f)==0x0000);
  assert(bw_float_to_half(1.0f)==0x3c00);
  assert(bw_float_to_half(1.5f)==0x3e00);
  assert(bw_float_to_half(-2.0f)==0xc000);
  assert(bw_half_to_float(0x3e00)==1.5f);
  assert(bw_roundtrip_fp16(-2.0f)==-2.0f);
  assert(std::isnan(bw_half_to_float(0x7e00)));
  assert(bw_float_to_half(std::numeric_limits<float>::infinity())==0x7c00);
  std::cout << "Blender native blenlib test PASS\n";
}
