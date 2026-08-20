package io.github.manhdua1.lotusoj.service.problem;

import io.github.manhdua1.lotusoj.dto.request.problem.CreateProblemRequest;
import io.github.manhdua1.lotusoj.dto.request.problem.ProblemFilterRequest;
import io.github.manhdua1.lotusoj.dto.request.problem.UpdateProblemRequest;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemDetailResponse;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemStatResponse;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemSummaryResponse;
import io.github.manhdua1.lotusoj.entity.problem.Problem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ProblemService {

    ProblemDetailResponse createProblem(CreateProblemRequest request);

    ProblemDetailResponse updateProblem(UUID id, UpdateProblemRequest request);

    ProblemDetailResponse getProblemById(UUID id);

    ProblemDetailResponse getProblemBySlug(String slug);

    Page<ProblemSummaryResponse> getProblems(ProblemFilterRequest filterRequest, Pageable pageable);

    void deleteProblem(UUID id);

    ProblemDetailResponse updateProblemStatus(UUID id, Problem.ProblemStatus status);

    ProblemStatResponse getProblemStats(UUID id);
}
