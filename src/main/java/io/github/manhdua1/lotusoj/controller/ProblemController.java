package io.github.manhdua1.lotusoj.controller;

import io.github.manhdua1.lotusoj.dto.request.problem.CreateProblemRequest;
import io.github.manhdua1.lotusoj.dto.request.problem.ProblemFilterRequest;
import io.github.manhdua1.lotusoj.dto.request.problem.UpdateProblemRequest;
import io.github.manhdua1.lotusoj.dto.response.ApiResponse;
import io.github.manhdua1.lotusoj.dto.response.PageResponse;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemDetailResponse;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemStatResponse;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemSummaryResponse;
import io.github.manhdua1.lotusoj.entity.problem.Problem;
import io.github.manhdua1.lotusoj.service.problem.ProblemService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProblemController {

    ProblemService problemService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'PROBLEM_SETTER')")
    public ApiResponse<ProblemDetailResponse> createProblem(@RequestBody @Valid CreateProblemRequest request) {
        return ApiResponse.success(problemService.createProblem(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROBLEM_SETTER')")
    public ApiResponse<ProblemDetailResponse> updateProblem(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateProblemRequest request) {
        return ApiResponse.success(problemService.updateProblem(id, request));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProblemDetailResponse> getProblemById(@PathVariable UUID id) {
        return ApiResponse.success(problemService.getProblemById(id));
    }

    @GetMapping("/slug/{slug}")
    public ApiResponse<ProblemDetailResponse> getProblemBySlug(@PathVariable String slug) {
        return ApiResponse.success(problemService.getProblemBySlug(slug));
    }

    @GetMapping
    public ApiResponse<PageResponse<ProblemSummaryResponse>> getProblems(
            @ModelAttribute ProblemFilterRequest filterRequest,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ProblemSummaryResponse> problemPage = problemService.getProblems(filterRequest, pageable);
        return ApiResponse.success(PageResponse.from(problemPage));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROBLEM_SETTER')")
    public ApiResponse<Void> deleteProblem(@PathVariable UUID id) {
        problemService.deleteProblem(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROBLEM_SETTER')")
    public ApiResponse<ProblemDetailResponse> updateProblemStatus(
            @PathVariable UUID id,
            @RequestParam Problem.ProblemStatus status) {
        return ApiResponse.success(problemService.updateProblemStatus(id, status));
    }

    @GetMapping("/{id}/stats")
    public ApiResponse<ProblemStatResponse> getProblemStats(@PathVariable UUID id) {
        return ApiResponse.success(problemService.getProblemStats(id));
    }
}
