package io.github.manhdua1.lotusoj.entity.submission;

import io.github.manhdua1.lotusoj.entity.testCase.TestCase;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "submission_results",
        indexes = {
                @Index(name = "idx_sub_results_submission_id", columnList = "submission_id")
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SubmissionResult {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @ManyToOne @JoinColumn(name = "submission_id")
    Submission submission;

    @ManyToOne @JoinColumn(name = "test_case_id")
    TestCase testCase;

    @Enumerated(EnumType.STRING)
    Verdict verdict;

    Integer runtimeMs;
    Integer memoryKb;
}