cmake_minimum_required(VERSION 3.24)
project(IllustratorGradientTools LANGUAGES CXX)

if(NOT ILLUSTRATOR_SDK_ROOT)
  message(FATAL_ERROR "请设置 ILLUSTRATOR_SDK_ROOT 指向 Adobe Illustrator SDK 根目录")
endif()

add_library(IllustratorGradientTools MODULE src/plugin_placeholder.cpp)
target_compile_features(IllustratorGradientTools PRIVATE cxx_std_17)
target_include_directories(IllustratorGradientTools PRIVATE "${ILLUSTRATOR_SDK_ROOT}/samplecode/common/includes")
if(WIN32)
  target_compile_definitions(IllustratorGradientTools PRIVATE WIN32 _WINDOWS)
endif()
