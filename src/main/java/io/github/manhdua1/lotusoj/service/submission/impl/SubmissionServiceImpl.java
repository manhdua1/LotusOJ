package io.github.manhdua1.lotusoj.service.submission.impl;

import io.github.manhdua1.lotusoj.config.RabbitMQConfig;
import io.github.manhdua1.lotusoj.dto.request.submission.SubmissionJudgeMessage;
import io.github.manhdua1.lotusoj.dto.request.submission.SubmissionRequest;
import io.github.manhdua1.lotusoj.dto.response.submission.SubmissionResponse;
import io.github.manhdua1.lotusoj.entity.auth.User;
import io.github.manhdua1.lotusoj.entity.problem.Problem;
import io.github.manhdua1.lotusoj.entity.submission.Submission;
import io.github.manhdua1.lotusoj.entity.submission.SubmissionStatus;
import io.github.manhdua1.lotusoj.exception.AppException;
import io.github.manhdua1.lotusoj.exception.ErrorCode;
import io.github.manhdua1.lotusoj.mapper.SubmissionMapper;
import io.github.manhdua1.lotusoj.repository.problem.ProblemRepository;
import io.github.manhdua1.lotusoj.repository.submission.SubmissionRepository;
import io.github.manhdua1.lotusoj.service.submission.SubmissionRedisService;
import io.github.manhdua1.lotusoj.service.submission.SubmissionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import io.github.manhdua1.lotusoj.dto.response.PageResponse;
import io.github.manhdua1.lotusoj.entity.submission.Language;
import io.github.manhdua1.lotusoj.entity.submission.Verdict;
import io.github.manhdua1.lotusoj.repository.submission.SubmissionSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SubmissionServiceImpl implements SubmissionService {

    SubmissionRepository submissionRepository;
    ProblemRepository problemRepository;
    SubmissionMapper submissionMapper;
    RabbitTemplate rabbitTemplate;
    SubmissionRedisService submissionRedisService;

    @Override
    @Transactional
    public SubmissionResponse createSubmission(SubmissionRequest request, User user) {
        if (user == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        Problem problem = problemRepository.findByIdAndIsDeletedFalse(request.getProblemId())
                .orElseThrow(() -> new AppException(ErrorCode.PROBLEM_NOT_FOUND));

        if (problem.getStatus() != Problem.ProblemStatus.PUBLISHED) {
            boolean canSubmit = user.getRole() == User.Role.ADMIN
                    || user.getRole() == User.Role.PROBLEM_SETTER
                    || (problem.getCreatedBy() != null && problem.getCreatedBy().getId().equals(user.getId()));

            if (!canSubmit) {
                throw new AppException(ErrorCode.PROBLEM_NOT_FOUND);
            }
        }

        Submission submission = Submission.builder()
                .user(user)
                .problem(problem)
                .language(request.getLanguage())
                .sourceCode(request.getSourceCode())
                .status(SubmissionStatus.PENDING)
                .submittedAt(LocalDateTime.now())
                .build();

        Submission savedSubmission = submissionRepository.save(submission);
        log.info("Created submission {} for problem {} by user {}", savedSubmission.getId(), problem.getId(), user.getId());

        // Push message to RabbitMQ for asynchronous judging only after transaction commit
        SubmissionJudgeMessage message = new SubmissionJudgeMessage(savedSubmission.getId());
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    rabbitTemplate.convertAndSend(
                            RabbitMQConfig.SUBMISSION_EXCHANGE,
                            RabbitMQConfig.SUBMISSION_ROUTING_KEY,
                            message
                    );
                    log.info("Sent judge message for submission {} to RabbitMQ after commit", savedSubmission.getId());
                }
            });
        } else {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.SUBMISSION_EXCHANGE,
                    RabbitMQConfig.SUBMISSION_ROUTING_KEY,
                    message
            );
            log.info("Sent judge message for submission {} to RabbitMQ immediately", savedSubmission.getId());
        }

        submissionRedisService.evictRecentSubmissions();

        return submissionMapper.toSubmissionResponse(savedSubmission);
    }

    @Override
    @Transactional(readOnly = true)
    public SubmissionResponse getSubmission(UUID id, User currentUser) {
        // 1. Try cache first
        Optional<SubmissionResponse> cached = submissionRedisService.getSubmission(id);
        if (cached.isPresent()) {
            return cached.get();
        }

        // 2. Query from database
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        SubmissionResponse response = submissionMapper.toSubmissionResponse(submission);

        // 3. Cache completed submissions (immutable results)
        if (submission.getStatus() == SubmissionStatus.DONE || submission.getStatus() == SubmissionStatus.FAILED) {
            submissionRedisService.saveSubmission(response);
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SubmissionResponse> getMySubmissions(
            User user,
            UUID problemId,
            String problemSlug,
            Language language,
            Verdict verdict,
            SubmissionStatus status,
            Pageable pageable) {

        if (user == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        Specification<Submission> spec = SubmissionSpecification.filter(
                user.getId(),
                null,
                problemId,
                problemSlug,
                language,
                verdict,
                status
        );

        Page<Submission> page = submissionRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(submissionMapper::toSubmissionResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SubmissionResponse> getAllSubmissions(
            UUID userId,
            String username,
            UUID problemId,
            String problemSlug,
            Language language,
            Verdict verdict,
            SubmissionStatus status,
            Pageable pageable) {

        boolean isDefaultRecent = (userId == null && (username == null || username.isBlank())
                && problemId == null && (problemSlug == null || problemSlug.isBlank())
                && language == null && verdict == null && status == null
                && pageable.getPageNumber() == 0);

        if (isDefaultRecent) {
            Optional<PageResponse<SubmissionResponse>> cached = submissionRedisService.getRecentSubmissions();
            if (cached.isPresent()) {
                return cached.get();
            }
        }

        Specification<Submission> spec = SubmissionSpecification.filter(
                userId,
                username,
                problemId,
                problemSlug,
                language,
                verdict,
                status
        );

        Page<Submission> page = submissionRepository.findAll(spec, pageable);
        PageResponse<SubmissionResponse> response = PageResponse.from(page.map(submissionMapper::toSubmissionResponse));

        if (isDefaultRecent) {
            submissionRedisService.saveRecentSubmissions(response);
        }

        return response;
    }
}
