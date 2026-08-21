package io.github.manhdua1.lotusoj.service.testCase.impl;

import io.github.manhdua1.lotusoj.entity.testCase.TestCase;
import io.github.manhdua1.lotusoj.repository.testCase.TestCaseRepository;
import io.github.manhdua1.lotusoj.service.testCase.TestCaseService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TestCaseServiceImpl implements TestCaseService {

    TestCaseRepository testCaseRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TestCase> getTestCasesForJudging(UUID problemId) {
        log.debug("Fetching all test cases for judging problem: {}", problemId);
        return testCaseRepository.findByProblemIdOrderByOrderIndexAsc(problemId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TestCase> getSampleTestCases(UUID problemId) {
        return testCaseRepository.findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(problemId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countByProblemId(UUID problemId) {
        return testCaseRepository.countByProblemId(problemId);
    }
}
