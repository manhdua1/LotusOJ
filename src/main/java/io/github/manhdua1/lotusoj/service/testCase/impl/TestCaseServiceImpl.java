package io.github.manhdua1.lotusoj.service.testCase.impl;

import io.github.manhdua1.lotusoj.dto.request.testCase.CreateTestCaseRequest;
import io.github.manhdua1.lotusoj.dto.request.testCase.UpdateTestCaseRequest;
import io.github.manhdua1.lotusoj.dto.response.testCase.TestCaseResponse;
import io.github.manhdua1.lotusoj.entity.problem.Problem;
import io.github.manhdua1.lotusoj.entity.testCase.TestCase;
import io.github.manhdua1.lotusoj.exception.AppException;
import io.github.manhdua1.lotusoj.exception.ErrorCode;
import io.github.manhdua1.lotusoj.mapper.TestCaseMapper;
import io.github.manhdua1.lotusoj.repository.problem.ProblemRepository;
import io.github.manhdua1.lotusoj.repository.testCase.TestCaseRepository;
import io.github.manhdua1.lotusoj.service.testCase.TestCaseService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TestCaseServiceImpl implements TestCaseService {

    TestCaseRepository testCaseRepository;
    ProblemRepository problemRepository;
    TestCaseMapper testCaseMapper;

    @Override
    @Transactional(readOnly = true)
    public List<TestCaseResponse> getTestCasesForJudging(UUID problemId) {
        log.debug("Fetching all test cases for judging problem: {}", problemId);
        List<TestCase> testCases = testCaseRepository.findByProblemIdOrderByOrderIndexAsc(problemId);
        return testCaseMapper.toTestCaseResponseList(testCases);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TestCaseResponse> getSampleTestCases(UUID problemId) {
        List<TestCase> testCases = testCaseRepository.findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(problemId);
        return testCaseMapper.toTestCaseResponseList(testCases);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TestCaseResponse> getTestCasesByProblemId(UUID problemId) {
        List<TestCase> testCases = testCaseRepository.findByProblemIdOrderByOrderIndexAsc(problemId);
        return testCaseMapper.toTestCaseResponseList(testCases);
    }

    @Override
    @Transactional
    public TestCaseResponse createTestCase(UUID problemId, CreateTestCaseRequest request) {
        Problem problem = problemRepository.findByIdAndIsDeletedFalse(problemId)
                .orElseThrow(() -> new AppException(ErrorCode.PROBLEM_NOT_FOUND));

        int orderIndex = (request.getOrderIndex() != null && request.getOrderIndex() > 0)
                ? request.getOrderIndex()
                : (int) testCaseRepository.countByProblemId(problemId) + 1;

        TestCase testCase = TestCase.builder()
                .problem(problem)
                .input(request.getInput() != null ? request.getInput() : "")
                .expectedOutput(request.getExpectedOutput() != null ? request.getExpectedOutput() : "")
                .isSample(request.getIsSample() != null && request.getIsSample())
                .orderIndex(orderIndex)
                .createdAt(LocalDateTime.now())
                .build();

        TestCase saved = testCaseRepository.save(testCase);
        log.info("Created test case ID: {} for problem: {}", saved.getId(), problemId);
        return testCaseMapper.toTestCaseResponse(saved);
    }

    @Override
    @Transactional
    public TestCaseResponse updateTestCase(UUID testCaseId, UpdateTestCaseRequest request) {
        TestCase testCase = testCaseRepository.findById(testCaseId)
                .orElseThrow(() -> new AppException(ErrorCode.TEST_CASE_NOT_FOUND));

        if (request.getInput() != null) {
            testCase.setInput(request.getInput());
        }
        if (request.getExpectedOutput() != null) {
            testCase.setExpectedOutput(request.getExpectedOutput());
        }
        if (request.getIsSample() != null) {
            testCase.setSample(request.getIsSample());
        }
        if (request.getOrderIndex() != null) {
            testCase.setOrderIndex(request.getOrderIndex());
        }

        TestCase saved = testCaseRepository.save(testCase);
        log.info("Updated test case ID: {}", saved.getId());
        return testCaseMapper.toTestCaseResponse(saved);
    }

    @Override
    @Transactional
    public void deleteTestCase(UUID testCaseId) {
        TestCase testCase = testCaseRepository.findById(testCaseId)
                .orElseThrow(() -> new AppException(ErrorCode.TEST_CASE_NOT_FOUND));

        testCaseRepository.delete(testCase);
        log.info("Deleted test case ID: {}", testCaseId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countByProblemId(UUID problemId) {
        return testCaseRepository.countByProblemId(problemId);
    }
}
