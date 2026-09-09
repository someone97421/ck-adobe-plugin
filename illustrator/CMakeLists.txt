cmake_minimum_required(VERSION 3.24)
project(IllustratorGradientTools LANGUAGES CXX)

if(NOT ILLUSTRATOR_SDK_ROOT)
  set(ILLUSTRATOR_SDK_ROOT "${CMAKE_CURRENT_LIST_DIR}/../vendor/adobe-illustrator-sdk-30.5.167/Adobe Illustrator 2026 SDK")
endif()

add_library(IllustratorGradientToolsCore STATIC src/GradientOperations.cpp)
target_compile_features(IllustratorGradientToolsCore PRIVATE cxx_std_17)
target_include_directories(IllustratorGradientToolsCore PRIVATE
  "${ILLUSTRATOR_SDK_ROOT}/illustratorapi/illustrator"
  "${ILLUSTRATOR_SDK_ROOT}/illustratorapi/illustrator/legacy"
  "${ILLUSTRATOR_SDK_ROOT}/illustratorapi/ate"
  "${ILLUSTRATOR_SDK_ROOT}/illustratorapi/adm"
  "${ILLUSTRATOR_SDK_ROOT}/illustratorapi/pica_sp"
)
if(WIN32)
  target_compile_definitions(IllustratorGradientToolsCore PRIVATE WIN32 _WINDOWS WIN_ENV)
endif()
