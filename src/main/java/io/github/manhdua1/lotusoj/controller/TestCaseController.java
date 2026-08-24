package io.github.manhdua1.lotusoj.controller;

import io.github.manhdua1.lotusoj.dto.response.ApiResponse;
import io.github.manhdua1.lotusoj.dto.response.testCase.TestCaseResponse;
import io.github.manhdua1.lotusoj.service.testCase.TestCaseService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TestCaseController {

    TestCaseService testCaseService;

    @GetMapping("/problems/{problemId}/testcases")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROBLEM_SETTER')")
    public ApiResponse<List<TestCaseResponse>> getProblemTestCases(@PathVariable UUID problemId) {
        return ApiResponse.success(testCaseService.getTestCasesByProblemId(problemId));
    }
}
