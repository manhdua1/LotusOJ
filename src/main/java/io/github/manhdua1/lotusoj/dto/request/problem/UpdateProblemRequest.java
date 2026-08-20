package io.github.manhdua1.lotusoj.dto.request.problem;

import io.github.manhdua1.lotusoj.entity.problem.Problem;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProblemRequest {

    private String title;
    private String statement;
    private String inputFormat;
    private String outputFormat;
    private String constraints;
    private String explanationNote;
    private Integer timeLimitMs;
    private Integer memoryLimitKb;
    private Problem.ProblemDifficulty difficulty;
    private List<String> tagNames;

}
