package io.github.manhdua1.lotusoj.dto.request.problem;

import io.github.manhdua1.lotusoj.entity.problem.Problem;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProblemRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String statement;       // đề bài, markdown

    private String inputFormat;
    private String outputFormat;
    private String constraints;
    private String explanationNote;

    @NotNull
    @Min(100)
    private Integer timeLimitMs;

    @NotNull @Min(16)
    private Integer memoryLimitKb;

    @NotNull
    private Problem.ProblemDifficulty difficulty;  // EASY / MEDIUM / HARD

    private List<String> tagNames;  // ví dụ ["Array", "Dynamic Programming"]
}
