package io.github.manhdua1.lotusoj.dto.request.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnalyzeComplexityRequest {
    @NotBlank(message = "Ngôn ngữ không được để trống")
    String language;

    @NotBlank(message = "Mã nguồn không được để trống")
    String sourceCode;

    String problemTitle;
}
