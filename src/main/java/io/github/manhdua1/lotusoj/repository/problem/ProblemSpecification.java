package io.github.manhdua1.lotusoj.repository.problem;

import io.github.manhdua1.lotusoj.dto.request.problem.ProblemFilterRequest;
import io.github.manhdua1.lotusoj.entity.problem.Problem;
import io.github.manhdua1.lotusoj.entity.problem.Tag;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class ProblemSpecification {

    private ProblemSpecification() {}

    public static Specification<Problem> filter(ProblemFilterRequest filterRequest, Problem.ProblemStatus effectiveStatus) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always filter out soft-deleted problems
            predicates.add(cb.isFalse(root.get("isDeleted")));

            // Filter by effective status (if specified or enforced by permissions)
            if (effectiveStatus != null) {
                predicates.add(cb.equal(root.get("status"), effectiveStatus));
            } else if (filterRequest != null && filterRequest.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filterRequest.getStatus()));
            }

            if (filterRequest != null) {
                // Filter by keyword (in title)
                if (filterRequest.getKeyword() != null && !filterRequest.getKeyword().isBlank()) {
                    String pattern = "%" + filterRequest.getKeyword().trim().toLowerCase() + "%";
                    predicates.add(cb.like(cb.lower(root.get("title")), pattern));
                }

                // Filter by difficulty
                if (filterRequest.getDifficulty() != null) {
                    predicates.add(cb.equal(root.get("difficulty"), filterRequest.getDifficulty()));
                }

                // Filter by tag
                if (filterRequest.getTag() != null && !filterRequest.getTag().isBlank()) {
                    Join<Problem, Tag> tagJoin = root.join("tags");
                    predicates.add(cb.equal(cb.lower(tagJoin.get("name")), filterRequest.getTag().trim().toLowerCase()));
                    if (query != null) {
                        query.distinct(true);
                    }
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
