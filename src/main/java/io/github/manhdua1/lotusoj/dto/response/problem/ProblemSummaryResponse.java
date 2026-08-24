package io.github.manhdua1.lotusoj.dto.response.problem;

import io.github.manhdua1.lotusoj.entity.problem.Problem;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemSummaryResponse {
    private UUID id;
    private String slug;
    private String title;
    private Problem.ProblemDifficulty difficulty;
    private Problem.ProblemStatus status;
    private List<String> tags;
    private Double acceptanceRate;  // tính từ total_accepted / total_submissions
    private Boolean solvedByCurrentUser; // null nếu chưa đăng nhập
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
}