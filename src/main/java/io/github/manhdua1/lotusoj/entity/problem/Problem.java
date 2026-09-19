package io.github.manhdua1.lotusoj.entity.problem;

import io.github.manhdua1.lotusoj.entity.auth.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(
        name = "problems",
        indexes = {
                @Index(name = "idx_problems_status_deleted_created", columnList = "is_deleted, status, created_at"),
                @Index(name = "idx_problems_difficulty", columnList = "is_deleted, status, difficulty, created_at")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Problem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(nullable = false, unique = true, length = 255)
    String slug;

    @Column(nullable = false, length = 255)
    String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    String statement;

    @Column(name = "input_format", columnDefinition = "TEXT")
    String inputFormat;

    @Column(name = "output_format", columnDefinition = "TEXT")
    String outputFormat;

    @Column(columnDefinition = "TEXT")
    String constraints;

    @Column(name = "explanation_note" ,columnDefinition = "TEXT")
    String explanationNote;

    @Column(name = "time_limit_ms", nullable = false)
    Integer timeLimitMs;

    @Column(name = "memory_limit_kb", nullable = false)
    Integer memoryLimitKb;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    ProblemDifficulty difficulty;

    @ManyToMany
    @JoinTable(
            name = "problem_tags",
            joinColumns = @JoinColumn(name = "problem_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    Set<Tag> tags = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    ProblemStatus status = ProblemStatus.DRAFT;

    @Column(name = "total_submissions", nullable = false)
    @Builder.Default
    Integer totalSubmissions = 0;

    @Column(name = "total_accepted", nullable = false)
    @Builder.Default
    Integer totalAccepted = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    User createdBy;

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    Boolean isDeleted = false;

    public enum ProblemDifficulty {
        EASY,
        MEDIUM,
        HARD
    }

    public enum ProblemStatus {
        DRAFT,
        PUBLISHED,
        ARCHIVED
    }
}
