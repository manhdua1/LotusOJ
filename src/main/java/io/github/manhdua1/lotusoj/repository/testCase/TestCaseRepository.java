package io.github.manhdua1.lotusoj.repository.testCase;

import io.github.manhdua1.lotusoj.entity.testCase.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TestCaseRepository extends JpaRepository<TestCase, UUID> {
    List<TestCase> findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(UUID problemId);
    List<TestCase> findByProblemIdOrderByOrderIndexAsc(UUID problemId);
}
