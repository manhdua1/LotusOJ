package io.github.manhdua1.lotusoj.controller;

import io.github.manhdua1.lotusoj.dto.request.submission.SubmissionRequest;
import io.github.manhdua1.lotusoj.dto.response.ApiResponse;
import io.github.manhdua1.lotusoj.dto.response.submission.SubmissionResponse;
import io.github.manhdua1.lotusoj.security.CustomUserDetails;
import io.github.manhdua1.lotusoj.service.submission.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping
    public ApiResponse<SubmissionResponse> submit(@RequestBody @Valid SubmissionRequest request,
                                                  @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(submissionService.createSubmission(request, userDetails.getUser()));
    }

    @GetMapping("/{id}")
    public ApiResponse<SubmissionResponse> getSubmission(@PathVariable UUID id,
                                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(submissionService.getSubmission(id, userDetails.getUser()));
    }
}
