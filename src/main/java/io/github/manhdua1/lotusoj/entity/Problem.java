package io.github.manhdua1.lotusoj.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "problems")
@Data
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
    ProblemDifficult difficulty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    ProblemStatus status = ProblemStatus.DRAFT;

    @Column(name = "total_submissions", nullable = false)
    Integer totalSubmissions = 0;

    @Column(name = "total_accepted", nullable = false)
    Integer totalAccepted = 0;

    @Column(name = "created_by", nullable = false, columnDefinition = "BINARY(16)")
    UUID createdBy;

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false)
    Boolean isDeleted = false;

    public enum ProblemDifficult {
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
