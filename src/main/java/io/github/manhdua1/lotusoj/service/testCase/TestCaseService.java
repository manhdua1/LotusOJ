package io.github.manhdua1.lotusoj.service.testCase;

import io.github.manhdua1.lotusoj.dto.request.testCase.CreateTestCaseRequest;
import io.github.manhdua1.lotusoj.dto.request.testCase.UpdateTestCaseRequest;
import io.github.manhdua1.lotusoj.dto.response.testCase.TestCaseResponse;

import java.util.List;
import java.util.UUID;

public interface TestCaseService {

    /**
     * Lấy tất cả test case của một bài (sắp xếp theo orderIndex tăng dần)
     * để phục vụ cho việc chấm bài.
     */
    List<TestCaseResponse> getTestCasesForJudging(UUID problemId);

    /**
     * Lấy chỉ các test case mẫu (isSample = true) để hiển thị cho người dùng.
     */
    List<TestCaseResponse> getSampleTestCases(UUID problemId);

    /**
     * Lấy tất cả test cases của một problem theo thứ tự orderIndex (dành cho Admin / Problem Setter).
     */
    List<TestCaseResponse> getTestCasesByProblemId(UUID problemId);

    /**
     * Tạo một test case mới gán cho Problem.
     */
    TestCaseResponse createTestCase(UUID problemId, CreateTestCaseRequest request);

    /**
     * Cập nhật thông tin/nội dung của một test case.
     */
    TestCaseResponse updateTestCase(UUID testCaseId, UpdateTestCaseRequest request);

    /**
     * Xóa một test case khỏi hệ thống.
     */
    void deleteTestCase(UUID testCaseId);

    /**
     * Đếm tổng số test case của một bài.
     */
    long countByProblemId(UUID problemId);
}
