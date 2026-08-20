package io.github.manhdua1.lotusoj.repository.submission;

import io.github.manhdua1.lotusoj.entity.submission.Language;
import io.github.manhdua1.lotusoj.entity.submission.Submission;
import io.github.manhdua1.lotusoj.entity.submission.SubmissionStatus;
import io.github.manhdua1.lotusoj.entity.submission.Verdict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubmissionRepository extends JpaRepository<Submission, UUID>, JpaSpecificationExecutor<Submission> {

    Page<Submission> findByUserId(UUID userId, Pageable pageable);

    Page<Submission> findByProblemId(UUID problemId, Pageable pageable);

    Page<Submission> findByUserIdAndProblemId(UUID userId, UUID problemId, Pageable pageable);

    boolean existsByUserIdAndProblemIdAndVerdict(UUID userId, UUID problemId, Verdict verdict);

    long countByProblemIdAndVerdict(UUID problemId, Verdict verdict);

    long countByProblemId(UUID problemId);

    long countByUserIdAndVerdict(UUID userId, Verdict verdict);

    long countByUserId(UUID userId);

    List<Submission> findByStatusOrderBySubmittedAtAsc(SubmissionStatus status);

    Optional<Submission> findTopByUserIdAndProblemIdOrderBySubmittedAtDesc(UUID userId, UUID problemId);

    @Query("SELECT s.language, COUNT(s) FROM Submission s WHERE s.problem.id = :problemId GROUP BY s.language")
    List<Object[]> countSubmissionsByLanguageForProblem(@Param("problemId") UUID problemId);

    @Query("SELECT DISTINCT s.problem.id FROM Submission s WHERE s.user.id = :userId AND s.verdict = 'ACCEPTED'")
    List<UUID> findSolvedProblemIdsByUserId(@Param("userId") UUID userId);
}
