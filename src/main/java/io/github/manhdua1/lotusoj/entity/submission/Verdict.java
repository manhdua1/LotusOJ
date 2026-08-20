package io.github.manhdua1.lotusoj.entity.submission;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Verdict {
    ACCEPTED("AC", "Accepted"),
    WRONG_ANSWER("WA", "Wrong Answer"),
    TIME_LIMIT_EXCEEDED("TLE", "Time Limit Exceeded"),
    MEMORY_LIMIT_EXCEEDED("MLE", "Memory Limit Exceeded"),
    COMPILATION_ERROR("CE", "Compilation Error"),
    RUNTIME_ERROR("RTE", "Runtime Error"),
    OUTPUT_LIMIT_EXCEEDED("OLE", "Output Limit Exceeded"),
    INTERNAL_ERROR("IE", "Internal Error");

    private final String shortName;
    private final String description;

    public boolean isAccepted() {
        return this == ACCEPTED;
    }
}
