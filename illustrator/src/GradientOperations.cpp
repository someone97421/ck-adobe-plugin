#include "GradientOperations.h"

namespace illustrator_gradient_tools {

AIErr ExtractGradientStops(const AIGradientSuite* suite, AIGradientHandle gradient,
                           std::vector<ColorSample>& output) {
    if (!suite || !gradient) return kBadParameterErr;
    ai::int16 count = 0;
    AIErr error = suite->GetGradientStopCount(gradient, &count);
    if (error) return error;
    output.clear();
    output.reserve(count);
    for (ai::int16 i = 0; i < count; ++i) {
        AIGradientStop stop{};
        error = suite->GetNthGradientStop(gradient, i, &stop);
        if (error) return error;
        output.push_back({stop.color, stop.rampPoint});
    }
    return kNoErr;
}

AIErr ReplaceGradientStops(const AIGradientSuite* suite, AIGradientHandle gradient,
                           const std::vector<AIColor>& palette) {
    if (!suite || !gradient || palette.empty()) return kBadParameterErr;
    ai::int16 count = 0;
    AIErr error = suite->GetGradientStopCount(gradient, &count);
    if (error) return error;
    for (ai::int16 i = 0; i < count; ++i) {
        AIGradientStop stop{};
        error = suite->GetNthGradientStop(gradient, i, &stop);
        if (error) return error;
        stop.color = palette[static_cast<size_t>(i) % palette.size()];
        error = suite->SetNthGradientStop(gradient, i, &stop);
        if (error) return error;
    }
    return kNoErr;
}

struct MeshCollector {
    std::vector<ColorSample>* output;
};

static void QueryMeshColor(AIColor* color, void* data) {
    auto* collector = static_cast<MeshCollector*>(data);
    if (collector && collector->output && color)
        collector->output->push_back({*color, -1.0});
}

struct MeshReplacer {
    const std::vector<AIColor>* palette;
    size_t index = 0;
};

static void ReplaceMeshColor(AIColor* color, void* data) {
    auto* replacer = static_cast<MeshReplacer*>(data);
    if (replacer && replacer->palette && !replacer->palette->empty() && color)
        *color = (*replacer->palette)[replacer->index++ % replacer->palette->size()];
}

AIErr ExtractMeshColors(const AIMeshSuite* suite, AIArtHandle mesh,
                        std::vector<ColorSample>& output) {
    if (!suite || !mesh) return kBadParameterErr;
    output.clear();
    MeshCollector collector{&output};
    suite->QueryColors(mesh, QueryMeshColor, &collector);
    return kNoErr;
}

AIErr ReplaceMeshColors(const AIMeshSuite* suite, AIArtHandle mesh,
                        const std::vector<AIColor>& palette) {
    if (!suite || !mesh || palette.empty()) return kBadParameterErr;
    MeshReplacer replacer{&palette};
    return suite->MapColors(mesh, ReplaceMeshColor, &replacer);
}

bool SupportsFreeformGradient() {
    return false;
}

}
