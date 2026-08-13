package io.github.manhdua1.lotusoj.repository.problem;

import io.github.manhdua1.lotusoj.entity.problem.Problem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProblemRepository extends JpaRepository<Problem, UUID> {
}
