package io.github.manhdua1.lotusoj.service.submission;

import io.github.manhdua1.lotusoj.dto.request.submission.SubmissionRequest;
import io.github.manhdua1.lotusoj.dto.response.submission.SubmissionResponse;
import io.github.manhdua1.lotusoj.entity.auth.User;

import java.util.UUID;

public interface SubmissionService {

    SubmissionResponse createSubmission(SubmissionRequest request, User user);

    SubmissionResponse getSubmission(UUID id, User currentUser);
}
