package io.github.manhdua1.lotusoj.dto.response.submission;

import io.github.manhdua1.lotusoj.entity.submission.Verdict;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RunCodeResponse {
    Verdict verdict;
    String errorLog;
    Integer runtimeMs;
    Long memoryKb;
    Integer passCount;
    Integer totalCount;
    List<RunCodeItemResult> sampleResults;

    // Single-case / fallback fields
    String input;
    String output;
    String expectedOutput;
    Boolean passed;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class RunCodeItemResult {
        Integer testCaseIndex;
        Verdict verdict;
        String input;
        String expectedOutput;
        String actualOutput;
        String errorLog;
        Integer runtimeMs;
        Long memoryKb;
        Boolean passed;
    }
}
