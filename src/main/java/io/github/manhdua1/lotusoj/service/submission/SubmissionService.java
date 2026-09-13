package io.github.manhdua1.lotusoj.service.submission;

import io.github.manhdua1.lotusoj.dto.request.submission.SubmissionRequest;
import io.github.manhdua1.lotusoj.dto.response.PageResponse;
import io.github.manhdua1.lotusoj.dto.response.submission.SubmissionResponse;
import io.github.manhdua1.lotusoj.entity.auth.User;
import io.github.manhdua1.lotusoj.entity.submission.Language;
import io.github.manhdua1.lotusoj.entity.submission.SubmissionStatus;
import io.github.manhdua1.lotusoj.entity.submission.Verdict;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface SubmissionService {

    SubmissionResponse createSubmission(SubmissionRequest request, User user);

    SubmissionResponse getSubmission(UUID id, User currentUser);

    PageResponse<SubmissionResponse> getMySubmissions(
            User user,
            UUID problemId,
            String problemSlug,
            Language language,
            Verdict verdict,
            SubmissionStatus status,
            Pageable pageable
    );

    PageResponse<SubmissionResponse> getAllSubmissions(
            UUID userId,
            String username,
            UUID problemId,
            String problemSlug,
            Language language,
            Verdict verdict,
            SubmissionStatus status,
            Pageable pageable
    );
}
