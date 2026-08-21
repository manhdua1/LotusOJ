package io.github.manhdua1.lotusoj.repository.submission;

import io.github.manhdua1.lotusoj.entity.submission.SubmissionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubmissionResultRepository extends JpaRepository<SubmissionResult, UUID> {

    List<SubmissionResult> findBySubmissionId(UUID submissionId);

    void deleteBySubmissionId(UUID submissionId);
}
