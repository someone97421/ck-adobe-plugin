#pragma once

#include "AIGradient.h"
#include "AIMesh.h"
#include <vector>

namespace illustrator_gradient_tools {

struct ColorSample {
    AIColor color{};
    double position = -1.0;
};

AIErr ExtractGradientStops(const AIGradientSuite* suite, AIGradientHandle gradient,
                           std::vector<ColorSample>& output);
AIErr ReplaceGradientStops(const AIGradientSuite* suite, AIGradientHandle gradient,
                           const std::vector<AIColor>& palette);

AIErr ExtractMeshColors(const AIMeshSuite* suite, AIArtHandle mesh,
                        std::vector<ColorSample>& output);
AIErr ReplaceMeshColors(const AIMeshSuite* suite, AIArtHandle mesh,
                        const std::vector<AIColor>& palette);

// SDK 30.5.167 does not expose a dedicated freeform-gradient point/line suite.
bool SupportsFreeformGradient();

}
