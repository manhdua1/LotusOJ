package io.github.manhdua1.lotusoj.repository.submission;

import io.github.manhdua1.lotusoj.entity.submission.Language;
import io.github.manhdua1.lotusoj.entity.submission.Submission;
import io.github.manhdua1.lotusoj.entity.submission.SubmissionStatus;
import io.github.manhdua1.lotusoj.entity.submission.Verdict;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class SubmissionSpecification {

    private SubmissionSpecification() {}

    public static Specification<Submission> filter(
            UUID userId,
            String username,
            UUID problemId,
            String problemSlug,
            Language language,
            Verdict verdict,
            SubmissionStatus status) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            } else if (username != null && !username.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("user").get("username")), username.trim().toLowerCase()));
            }

            if (problemId != null) {
                predicates.add(cb.equal(root.get("problem").get("id"), problemId));
            } else if (problemSlug != null && !problemSlug.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("problem").get("slug")), problemSlug.trim().toLowerCase()));
            }

            if (language != null) {
                predicates.add(cb.equal(root.get("language"), language));
            }

            if (verdict != null) {
                predicates.add(cb.equal(root.get("verdict"), verdict));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
