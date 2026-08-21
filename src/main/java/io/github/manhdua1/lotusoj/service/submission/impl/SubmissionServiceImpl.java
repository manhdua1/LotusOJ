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
import io.github.manhdua1.lotusoj.service.submission.SubmissionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

        // Push message to RabbitMQ for asynchronous judging
        SubmissionJudgeMessage message = new SubmissionJudgeMessage(savedSubmission.getId());
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.SUBMISSION_EXCHANGE,
                RabbitMQConfig.SUBMISSION_ROUTING_KEY,
                message
        );
        log.info("Sent judge message for submission {} to RabbitMQ", savedSubmission.getId());

        return submissionMapper.toSubmissionResponse(savedSubmission);
    }

    @Override
    @Transactional(readOnly = true)
    public SubmissionResponse getSubmission(UUID id, User currentUser) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        return submissionMapper.toSubmissionResponse(submission);
    }
}
