// SPDX-License-Identifier: MIT
// Temporary build hook. Replace with the Adobe Illustrator SDK entry point
// after ILLUSTRATOR_SDK_ROOT is configured. No Adobe SDK headers are bundled.
extern "C" __declspec(dllexport) int IllustratorGradientToolsBuildHook() {
    return 0;
}
