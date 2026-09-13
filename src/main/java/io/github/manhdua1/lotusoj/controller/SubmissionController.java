package io.github.manhdua1.lotusoj.controller;

import io.github.manhdua1.lotusoj.dto.request.submission.SubmissionRequest;
import io.github.manhdua1.lotusoj.dto.response.ApiResponse;
import io.github.manhdua1.lotusoj.dto.response.PageResponse;
import io.github.manhdua1.lotusoj.dto.response.submission.SubmissionResponse;
import io.github.manhdua1.lotusoj.entity.submission.Language;
import io.github.manhdua1.lotusoj.entity.submission.SubmissionStatus;
import io.github.manhdua1.lotusoj.entity.submission.Verdict;
import io.github.manhdua1.lotusoj.exception.AppException;
import io.github.manhdua1.lotusoj.exception.ErrorCode;
import io.github.manhdua1.lotusoj.security.CustomUserDetails;
import io.github.manhdua1.lotusoj.service.submission.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
        if (userDetails == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return ApiResponse.success(submissionService.createSubmission(request, userDetails.getUser()));
    }

    /**
     * Lấy danh sách các bài nộp của người dùng hiện đang đăng nhập (kèm bộ lọc & phân trang)
     */
    @GetMapping("/my")
    public ApiResponse<PageResponse<SubmissionResponse>> getMySubmissions(
            @RequestParam(required = false) UUID problemId,
            @RequestParam(required = false) String problemSlug,
            @RequestParam(required = false) Language language,
            @RequestParam(required = false) Verdict verdict,
            @RequestParam(required = false) SubmissionStatus status,
            @PageableDefault(sort = "submittedAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return ApiResponse.success(submissionService.getMySubmissions(
                userDetails.getUser(), problemId, problemSlug, language, verdict, status, pageable));
    }

    /**
     * Lấy danh sách tất cả các bài nộp trên toàn hệ thống (kèm bộ lọc & phân trang)
     */
    @GetMapping
    public ApiResponse<PageResponse<SubmissionResponse>> getAllSubmissions(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) UUID problemId,
            @RequestParam(required = false) String problemSlug,
            @RequestParam(required = false) Language language,
            @RequestParam(required = false) Verdict verdict,
            @RequestParam(required = false) SubmissionStatus status,
            @PageableDefault(sort = "submittedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(submissionService.getAllSubmissions(
                userId, username, problemId, problemSlug, language, verdict, status, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<SubmissionResponse> getSubmission(@PathVariable UUID id,
                                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(submissionService.getSubmission(id, userDetails != null ? userDetails.getUser() : null));
    }
}
