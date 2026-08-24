package io.github.manhdua1.lotusoj.controller;

import io.github.manhdua1.lotusoj.dto.request.testCase.CreateTestCaseRequest;
import io.github.manhdua1.lotusoj.dto.request.testCase.UpdateTestCaseRequest;
import io.github.manhdua1.lotusoj.dto.response.ApiResponse;
import io.github.manhdua1.lotusoj.dto.response.testCase.TestCaseResponse;
import io.github.manhdua1.lotusoj.service.testCase.TestCaseService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TestCaseController {

    TestCaseService testCaseService;

    /**
     * Lấy danh sách các testcase mẫu (isSample = true) công khai cho người dùng/thí sinh xem.
     */
    @GetMapping("/problems/{problemId}/testcases/samples")
    public ApiResponse<List<TestCaseResponse>> getSampleTestCases(@PathVariable UUID problemId) {
        return ApiResponse.success(testCaseService.getSampleTestCases(problemId));
    }

    /**
     * Lấy toàn bộ danh sách testcase của bài tập (dành cho Admin / Problem Setter).
     */
    @GetMapping("/problems/{problemId}/testcases")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROBLEM_SETTER')")
    public ApiResponse<List<TestCaseResponse>> getProblemTestCases(@PathVariable UUID problemId) {
        return ApiResponse.success(testCaseService.getTestCasesByProblemId(problemId));
    }

    /**
     * Tạo một testcase mới và gán vào bài tập.
     */
    @PostMapping("/problems/{problemId}/testcases")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'PROBLEM_SETTER')")
    public ApiResponse<TestCaseResponse> createTestCase(
            @PathVariable UUID problemId,
            @RequestBody @Valid CreateTestCaseRequest request) {
        return ApiResponse.success(testCaseService.createTestCase(problemId, request));
    }

    /**
     * Cập nhật thông tin/nội dung của 1 testcase.
     */
    @PutMapping("/testcases/{testCaseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROBLEM_SETTER')")
    public ApiResponse<TestCaseResponse> updateTestCase(
            @PathVariable UUID testCaseId,
            @RequestBody @Valid UpdateTestCaseRequest request) {
        return ApiResponse.success(testCaseService.updateTestCase(testCaseId, request));
    }

    /**
     * Xóa 1 testcase khỏi bài tập.
     */
    @DeleteMapping("/testcases/{testCaseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROBLEM_SETTER')")
    public ApiResponse<Void> deleteTestCase(@PathVariable UUID testCaseId) {
        testCaseService.deleteTestCase(testCaseId);
        return ApiResponse.success(null);
    }
}
