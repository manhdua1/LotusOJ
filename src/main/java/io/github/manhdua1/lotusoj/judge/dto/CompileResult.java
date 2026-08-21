package io.github.manhdua1.lotusoj.judge.dto;

import io.github.manhdua1.lotusoj.entity.submission.Verdict;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompileResult {
    boolean success;
    Verdict verdict;
    String errorLog;
}
