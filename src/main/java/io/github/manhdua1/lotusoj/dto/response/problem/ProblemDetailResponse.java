package io.github.manhdua1.lotusoj.dto.response.problem;

import io.github.manhdua1.lotusoj.entity.problem.Problem;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemDetailResponse {

    private UUID id;
    private String slug;
    private String title;
    private String statement;
    private String inputFormat;
    private String outputFormat;
    private String constraints;
    private String explanationNote;
    private Integer timeLimitMs;
    private Integer memoryLimitKb;
    private Problem.ProblemDifficulty difficulty;
    private Problem.ProblemStatus status;
    private List<String> tags;
    //private List<TestCaseResponse> sampleTestCases; // chỉ test case có isSample=true
    private Double acceptanceRate;
    private LocalDateTime createdAt;
    //private ProblemPermissions permissions; // canEdit, canDelete, canPublish (đã bàn ở phần phân quyền theo nút)
}