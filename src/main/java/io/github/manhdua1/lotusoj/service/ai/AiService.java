package io.github.manhdua1.lotusoj.service.ai;

import io.github.manhdua1.lotusoj.dto.request.ai.AnalyzeComplexityRequest;
import io.github.manhdua1.lotusoj.dto.response.ai.ComplexityAnalysisResponse;

public interface AiService {
    ComplexityAnalysisResponse analyzeCodeComplexity(AnalyzeComplexityRequest request);
}
