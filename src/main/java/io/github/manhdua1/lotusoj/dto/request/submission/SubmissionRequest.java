package io.github.manhdua1.lotusoj.dto.request.submission;

import io.github.manhdua1.lotusoj.entity.submission.Language;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionRequest {
    @NotNull
    UUID problemId;

    @NotNull
    Language language;

    @NotBlank
    String sourceCode;
}