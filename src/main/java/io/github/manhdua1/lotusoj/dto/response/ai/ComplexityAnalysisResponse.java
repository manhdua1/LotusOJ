package io.github.manhdua1.lotusoj.dto.response.ai;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ComplexityAnalysisResponse {

    TimeComplexityDto timeComplexity;
    SpaceComplexityDto spaceComplexity;
    String algorithmParadigm;
    List<CodeInsightDto> codeInsights;
    String optimizationAdvice;
    int confidenceScore;
    String aiModel;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class TimeComplexityDto {
        String bigO;
        String name;
        String verdict;
        String summary;
        String keyFactor;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class SpaceComplexityDto {
        String bigO;
        String name;
        String verdict;
        String summary;
        List<String> memoryBreakdown;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class CodeInsightDto {
        String type;
        String title;
        String description;
    }
}
