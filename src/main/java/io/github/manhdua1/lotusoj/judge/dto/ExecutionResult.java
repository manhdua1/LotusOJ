package io.github.manhdua1.lotusoj.judge.dto;

import io.github.manhdua1.lotusoj.entity.submission.Verdict;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionResult {
    Verdict verdict;
    String output;
    String errorMessage;
    int runtimeMs;
    long memoryKb;
}
