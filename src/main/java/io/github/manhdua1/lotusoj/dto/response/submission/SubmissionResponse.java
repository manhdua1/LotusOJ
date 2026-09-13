package io.github.manhdua1.lotusoj.dto.response.submission;

import io.github.manhdua1.lotusoj.entity.submission.Language;
import io.github.manhdua1.lotusoj.entity.submission.SubmissionStatus;
import io.github.manhdua1.lotusoj.entity.submission.Verdict;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionResponse {
    UUID id;
    UUID problemId;
    String problemTitle;
    String problemSlug;
    UUID userId;
    String username;
    Language language;
    SubmissionStatus status;
    Verdict verdict;
    Integer runtimeMs;
    Integer memoryKb;
    Integer passTestCount;
    Integer totalTestCount;
    String compileErrorLog;
    LocalDateTime submittedAt;
    LocalDateTime judgedAt;
}