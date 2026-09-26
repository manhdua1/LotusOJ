package io.github.manhdua1.lotusoj.dto.request.submission;

import io.github.manhdua1.lotusoj.entity.submission.Language;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RunCodeRequest {
    @NotNull(message = "Mã bài tập không được để trống")
    UUID problemId;

    @NotNull(message = "Ngôn ngữ không được để trống")
    Language language;

    @NotBlank(message = "Mã nguồn không được để trống")
    String sourceCode;
}
