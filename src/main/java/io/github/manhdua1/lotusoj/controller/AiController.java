package io.github.manhdua1.lotusoj.controller;

import io.github.manhdua1.lotusoj.dto.request.ai.AnalyzeComplexityRequest;
import io.github.manhdua1.lotusoj.dto.response.ApiResponse;
import io.github.manhdua1.lotusoj.dto.response.ai.ComplexityAnalysisResponse;
import io.github.manhdua1.lotusoj.service.ai.AiService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AiController {

    AiService aiService;

    @PostMapping("/analyze-complexity")
    public ApiResponse<ComplexityAnalysisResponse> analyzeComplexity(
            @RequestBody @Valid AnalyzeComplexityRequest request) {
        ComplexityAnalysisResponse response = aiService.analyzeCodeComplexity(request);
        return ApiResponse.success(response);
    }
}
