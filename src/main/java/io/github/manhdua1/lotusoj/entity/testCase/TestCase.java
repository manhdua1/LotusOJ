package io.github.manhdua1.lotusoj.entity.testCase;

import io.github.manhdua1.lotusoj.entity.problem.Problem;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "test_cases")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TestCase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    Problem problem;

    @Column(nullable = false, columnDefinition = "TEXT")
    String input;

    @Column(nullable = false, columnDefinition = "TEXT")
    String expectedOutput;

    @Column(name = "is_sample", nullable = false)
    @Builder.Default
    boolean isSample = false;

    @Column(name = "order_index", nullable = false)
    int orderIndex;

    @Column(name = "created_at")
    @Builder.Default
    LocalDateTime createdAt = LocalDateTime.now();
}
