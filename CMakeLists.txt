cmake_minimum_required(VERSION 3.20)
project(blender_web_core LANGUAGES C CXX)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(BLENDER_SOURCE_DIR "${CMAKE_CURRENT_LIST_DIR}/third_party/blender" CACHE PATH "Blender source checkout")
set(BLENLIB "${BLENDER_SOURCE_DIR}/source/blender/blenlib")
if(NOT EXISTS "${BLENLIB}/intern/math_half.cc")
  message(FATAL_ERROR "Blender source missing. Run scripts/fetch-blender.sh")
endif()
# Compiles original Blender 5.2.2 blenlib C++, not a rewritten algorithm.
add_library(blender_math_half STATIC "${BLENLIB}/intern/math_half.cc")
target_include_directories(blender_math_half PUBLIC "${BLENLIB}")
target_compile_definitions(blender_math_half PRIVATE NDEBUG)

if(EMSCRIPTEN)
  add_executable(blender_core src/bridge.cpp src/wasm_entry.cpp)
  target_link_libraries(blender_core PRIVATE blender_math_half)
  target_link_options(blender_core PRIVATE
    "-O2" "-sMODULARIZE=1" "-sEXPORT_ES6=1"
    "-sEXPORT_NAME=createBlenderCore" "-sENVIRONMENT=web,worker,node"
    "-sALLOW_MEMORY_GROWTH=1" "-sFILESYSTEM=0")
  set_target_properties(blender_core PROPERTIES
    OUTPUT_NAME "blender_core" SUFFIX ".js"
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_LIST_DIR}/dist")
else()
  enable_testing()
  add_executable(blender_core_native_tests tests/native.cpp src/bridge.cpp)
  target_link_libraries(blender_core_native_tests PRIVATE blender_math_half)
  add_test(NAME blender_core_native_tests COMMAND blender_core_native_tests)
endif()
