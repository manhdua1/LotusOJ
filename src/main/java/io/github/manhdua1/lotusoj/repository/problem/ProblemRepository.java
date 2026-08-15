package io.github.manhdua1.lotusoj.repository.problem;

import io.github.manhdua1.lotusoj.entity.problem.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface ProblemRepository extends JpaRepository<Problem, UUID>, JpaSpecificationExecutor<Problem> {
    Optional<Problem> findByIdAndIsDeletedFalse(UUID id);
    Optional<Problem> findBySlugAndIsDeletedFalse(String slug);
    boolean existsBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, UUID id);
}

