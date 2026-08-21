package io.github.manhdua1.lotusoj.service.testCase;

import io.github.manhdua1.lotusoj.entity.testCase.TestCase;

import java.util.List;
import java.util.UUID;

public interface TestCaseService {

    /**
     * Lấy tất cả test case của một bài (sắp xếp theo orderIndex tăng dần)
     * để phục vụ cho việc chấm bài.
     */
    List<TestCase> getTestCasesForJudging(UUID problemId);

    /**
     * Lấy chỉ các test case mẫu (isSample = true) để hiển thị cho người dùng.
     */
    List<TestCase> getSampleTestCases(UUID problemId);

    /**
     * Đếm tổng số test case của một bài.
     */
    long countByProblemId(UUID problemId);
}
