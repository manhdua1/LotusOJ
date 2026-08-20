package io.github.manhdua1.lotusoj.entity.submission;

import io.github.manhdua1.lotusoj.entity.auth.User;
import io.github.manhdua1.lotusoj.entity.problem.Problem;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "submissions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    Problem problem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    Language language;

    @Column(name = "source_code", nullable = false, columnDefinition = "TEXT")
    String sourceCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    SubmissionStatus status = SubmissionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "verdict", length = 30)
    Verdict verdict; // null cho tới khi chấm xong

    @Column(name = "runtime_ms")
    Integer runtimeMs;

    @Column(name = "memory_kb")
    Integer memoryKb;

    @Column(name = "pass_test_count")
    Integer passTestCount;

    @Column(name = "total_test_count")
    Integer totalTestCount;

    @Column(name = "compile_error_log", columnDefinition = "TEXT")
    String compileErrorLog;

    @Column(name = "submitted_at", nullable = false)
    LocalDateTime submittedAt;

    @Column(name = "judged_at")
    LocalDateTime judgedAt;
}