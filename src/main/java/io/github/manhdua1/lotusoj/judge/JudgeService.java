package io.github.manhdua1.lotusoj.judge;

import io.github.manhdua1.lotusoj.entity.problem.Problem;
import io.github.manhdua1.lotusoj.entity.submission.Submission;
import io.github.manhdua1.lotusoj.entity.submission.SubmissionResult;
import io.github.manhdua1.lotusoj.entity.submission.SubmissionStatus;
import io.github.manhdua1.lotusoj.entity.submission.Verdict;
import io.github.manhdua1.lotusoj.entity.testCase.TestCase;
import io.github.manhdua1.lotusoj.judge.dto.CompileResult;
import io.github.manhdua1.lotusoj.judge.dto.ExecutionResult;
import io.github.manhdua1.lotusoj.mapper.SubmissionMapper;
import io.github.manhdua1.lotusoj.repository.problem.ProblemRepository;
import io.github.manhdua1.lotusoj.repository.submission.SubmissionRepository;
import io.github.manhdua1.lotusoj.repository.submission.SubmissionResultRepository;
import io.github.manhdua1.lotusoj.service.problem.ProblemRedisService;
import io.github.manhdua1.lotusoj.service.testCase.TestCaseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class JudgeService {

    private final SubmissionRepository submissionRepository;
    private final SubmissionResultRepository submissionResultRepository;
    private final TestCaseService testCaseService;
    private final ProblemRepository problemRepository;
    private final ProblemRedisService problemRedisService;
    private final DockerExecutor dockerExecutor;
    private final SimpMessagingTemplate messagingTemplate;
    private final SubmissionMapper mapper;

    @Transactional
    public void judgeSubmission(UUID submissionId) {
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) {
            log.warn("Submission not found for judging: {}", submissionId);
            return;
        }

        submission.setStatus(SubmissionStatus.JUDGING);
        submissionRepository.save(submission);
        notifyClient(submission);

        Path workDir = null;
        try {
            workDir = dockerExecutor.createWorkDir();

            // 1. Compile source code
            CompileResult compileResult = dockerExecutor.compile(
                    submission.getLanguage(),
                    submission.getSourceCode(),
                    workDir
            );

            if (!compileResult.isSuccess()) {
                finishWithVerdict(submission, Verdict.COMPILATION_ERROR, compileResult.getErrorLog(), 0, 0, 0, 0);
                return;
            }

            // 2. Fetch test cases
            List<TestCase> testCases = testCaseService.getTestCasesForJudging(submission.getProblem().getId());
            if (testCases.isEmpty()) {
                log.warn("No test cases found for problem {}", submission.getProblem().getId());
                finishWithVerdict(submission, Verdict.ACCEPTED, null, 0, 0, 0, 0);
                return;
            }

            int passCount = 0;
            int maxRuntimeMs = 0;
            int maxMemoryKb = 0;
            Verdict finalVerdict = Verdict.ACCEPTED;

            int timeLimit = submission.getProblem().getTimeLimitMs() != null ? submission.getProblem().getTimeLimitMs() : 1000;
            int memoryLimit = submission.getProblem().getMemoryLimitKb() != null ? submission.getProblem().getMemoryLimitKb() : 262144;

            // 3. Run each test case
            for (TestCase tc : testCases) {
                ExecutionResult execResult = dockerExecutor.execute(
                        submission.getLanguage(),
                        workDir,
                        tc.getInput(),
                        timeLimit,
                        memoryLimit
                );

                Verdict tcVerdict = execResult.getVerdict();
                if (tcVerdict == Verdict.ACCEPTED) {
                    tcVerdict = compareOutput(execResult.getOutput(), tc.getExpectedOutput());
                }

                if (execResult.getRuntimeMs() > maxRuntimeMs) {
                    maxRuntimeMs = execResult.getRuntimeMs();
                }
                if (execResult.getMemoryKb() > maxMemoryKb) {
                    maxMemoryKb = (int) execResult.getMemoryKb();
                }

                submissionResultRepository.save(SubmissionResult.builder()
                        .submission(submission)
                        .testCase(tc)
                        .verdict(tcVerdict)
                        .runtimeMs(execResult.getRuntimeMs())
                        .memoryKb((int) execResult.getMemoryKb())
                        .build());

                if (tcVerdict == Verdict.ACCEPTED) {
                    passCount++;
                } else {
                    finalVerdict = tcVerdict;
                    break; // Stop on first failing test case (ICPC style)
                }
            }

            finishWithVerdict(submission, finalVerdict, null, passCount, testCases.size(), maxRuntimeMs, maxMemoryKb);

        } catch (Exception e) {
            log.error("Internal error judging submission {}", submissionId, e);
            finishWithVerdict(submission, Verdict.INTERNAL_ERROR, e.getMessage(), 0, 0, 0, 0);
        } finally {
            if (workDir != null) {
                dockerExecutor.cleanupWorkDir(workDir);
            }
        }
    }

    private Verdict compareOutput(String actualOutput, String expectedOutput) {
        if (actualOutput == null) actualOutput = "";
        if (expectedOutput == null) expectedOutput = "";

        String actual = actualOutput.stripTrailing();
        String expected = expectedOutput.stripTrailing();

        return actual.equals(expected) ? Verdict.ACCEPTED : Verdict.WRONG_ANSWER;
    }

    private void finishWithVerdict(Submission submission, Verdict verdict, String errorLog,
                                   int passCount, int totalCount, int runtimeMs, int memoryKb) {
        submission.setStatus(SubmissionStatus.DONE);
        submission.setVerdict(verdict);
        submission.setCompileErrorLog(errorLog);
        submission.setPassTestCount(passCount);
        submission.setTotalTestCount(totalCount);
        submission.setRuntimeMs(runtimeMs);
        submission.setMemoryKb(memoryKb);
        submission.setJudgedAt(LocalDateTime.now());
        submissionRepository.save(submission);

        // Update problem statistics in DB & Redis
        try {
            Problem problem = problemRepository.findById(submission.getProblem().getId()).orElse(null);
            if (problem != null) {
                problem.setTotalSubmissions(problem.getTotalSubmissions() + 1);
                if (verdict == Verdict.ACCEPTED) {
                    problem.setTotalAccepted(problem.getTotalAccepted() + 1);
                }
                problemRepository.save(problem);

                problemRedisService.incrementSubmissions(problem.getId(), 1);
                if (verdict == Verdict.ACCEPTED) {
                    problemRedisService.incrementAccepted(problem.getId(), 1);
                }
                problemRedisService.evictProblemDetail(problem.getId(), problem.getSlug());
                problemRedisService.evictProblemListCache();
            }
        } catch (Exception e) {
            log.warn("Failed to update problem statistics for problem {}", submission.getProblem().getId(), e);
        }

        notifyClient(submission);
    }

    private void notifyClient(Submission submission) {
        try {
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/submissions/" + submission.getId(), mapper.toSubmissionResponse(submission));
            }
        } catch (Exception e) {
            log.debug("WebSocket notification skipped or failed for submission {}: {}", submission.getId(), e.getMessage());
        }
    }
}