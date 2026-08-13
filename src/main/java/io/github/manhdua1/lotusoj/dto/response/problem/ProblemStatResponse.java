package io.github.manhdua1.lotusoj.dto.response.problem;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemStatResponse {
    private UUID problemId;
    private Integer totalSubmissions;
    private Integer totalAccepted;
    private Double acceptanceRate;
    //private Map<Language, Integer> submissionsByLanguage; // ví dụ {CPP: 120, JAVA: 45, PYTHON: 80}
}