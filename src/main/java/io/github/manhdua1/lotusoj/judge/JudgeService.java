package io.github.manhdua1.lotusoj.judge;

import io.github.manhdua1.lotusoj.dto.request.submission.RunCodeRequest;
import io.github.manhdua1.lotusoj.dto.response.submission.RunCodeResponse;
import io.github.manhdua1.lotusoj.dto.response.testCase.TestCaseResponse;
import io.github.manhdua1.lotusoj.entity.problem.Problem;
import io.github.manhdua1.lotusoj.entity.submission.Submission;
import io.github.manhdua1.lotusoj.entity.submission.SubmissionResult;
import io.github.manhdua1.lotusoj.entity.submission.SubmissionStatus;
import io.github.manhdua1.lotusoj.entity.submission.Verdict;
import io.github.manhdua1.lotusoj.entity.testCase.TestCase;
import io.github.manhdua1.lotusoj.judge.dto.CompileResult;
import io.github.manhdua1.lotusoj.judge.dto.ExecutionResult;
import io.github.manhdua1.lotusoj.exception.AppException;
import io.github.manhdua1.lotusoj.exception.ErrorCode;
import io.github.manhdua1.lotusoj.mapper.SubmissionMapper;
import io.github.manhdua1.lotusoj.repository.problem.ProblemRepository;
import io.github.manhdua1.lotusoj.repository.submission.SubmissionRepository;
import io.github.manhdua1.lotusoj.repository.submission.SubmissionResultRepository;
import io.github.manhdua1.lotusoj.service.problem.ProblemRedisService;
import io.github.manhdua1.lotusoj.service.submission.SubmissionRedisService;
import io.github.manhdua1.lotusoj.service.testCase.TestCaseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
    private final SubmissionRedisService submissionRedisService;

    @Transactional
    public void judgeSubmission(UUID submissionId) {
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) {
            try {
                Thread.sleep(100);
            } catch (InterruptedException ignored) {}
            submission = submissionRepository.findById(submissionId).orElse(null);
        }

        if (submission == null) {
            log.error("Submission not found for judging: {}", submissionId);
            throw new AppException(ErrorCode.SUBMISSION_NOT_FOUND);
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
            List<TestCaseResponse> testCases = testCaseService.getTestCasesForJudging(submission.getProblem().getId());
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
            for (TestCaseResponse tc : testCases) {
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
                        .testCase(TestCase.builder().id(tc.getId()).build())
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

    public RunCodeResponse runCode(RunCodeRequest request) {
        int timeLimit = 2000;
        int memoryLimit = 262144; // 256 MB

        List<TestCaseResponse> sampleTestCases = List.of();
        if (request.getProblemId() != null) {
            Problem problem = problemRepository.findById(request.getProblemId()).orElse(null);
            if (problem != null) {
                if (problem.getTimeLimitMs() != null) {
                    timeLimit = problem.getTimeLimitMs();
                }
                if (problem.getMemoryLimitKb() != null) {
                    memoryLimit = problem.getMemoryLimitKb();
                }
            }
            sampleTestCases = testCaseService.getSampleTestCases(request.getProblemId());
        }

        if (sampleTestCases == null || sampleTestCases.isEmpty()) {
            return RunCodeResponse.builder()
                    .verdict(Verdict.INTERNAL_ERROR)
                    .errorLog("Bài tập này hiện chưa có testcase mẫu để chạy thử.")
                    .passCount(0)
                    .totalCount(0)
                    .sampleResults(List.of())
                    .passed(false)
                    .build();
        }

        Path workDir = null;
        try {
            workDir = dockerExecutor.createWorkDir();

            // 1. Compile source code
            CompileResult compileResult = dockerExecutor.compile(
                    request.getLanguage(),
                    request.getSourceCode(),
                    workDir
            );

            if (!compileResult.isSuccess()) {
                return RunCodeResponse.builder()
                        .verdict(Verdict.COMPILATION_ERROR)
                        .errorLog(compileResult.getErrorLog())
                        .passCount(0)
                        .totalCount(sampleTestCases.size())
                        .sampleResults(List.of())
                        .passed(false)
                        .build();
            }

            // 2. Execute against all sample test cases
            List<RunCodeResponse.RunCodeItemResult> itemResults = new ArrayList<>();
            int passCount = 0;
            int maxRuntimeMs = 0;
            long maxMemoryKb = 0;
            Verdict overallVerdict = Verdict.ACCEPTED;

            for (int i = 0; i < sampleTestCases.size(); i++) {
                TestCaseResponse tc = sampleTestCases.get(i);
                String tcInput = tc.getInput() != null ? tc.getInput() : "";
                String tcExpected = tc.getExpectedOutput() != null ? tc.getExpectedOutput() : "";

                ExecutionResult execResult = dockerExecutor.execute(
                        request.getLanguage(),
                        workDir,
                        tcInput,
                        timeLimit,
                        memoryLimit
                );

                Verdict tcVerdict = execResult.getVerdict();
                boolean passed = false;

                if (tcVerdict == Verdict.ACCEPTED) {
                    tcVerdict = compareOutput(execResult.getOutput(), tcExpected);
                    passed = (tcVerdict == Verdict.ACCEPTED);
                }

                if (passed) {
                    passCount++;
                } else if (overallVerdict == Verdict.ACCEPTED) {
                    overallVerdict = tcVerdict;
                }

                if (execResult.getRuntimeMs() > maxRuntimeMs) {
                    maxRuntimeMs = execResult.getRuntimeMs();
                }
                if (execResult.getMemoryKb() > maxMemoryKb) {
                    maxMemoryKb = execResult.getMemoryKb();
                }

                itemResults.add(RunCodeResponse.RunCodeItemResult.builder()
                        .testCaseIndex(i)
                        .verdict(tcVerdict)
                        .input(tcInput)
                        .expectedOutput(tcExpected)
                        .actualOutput(execResult.getOutput())
                        .errorLog(execResult.getErrorMessage())
                        .runtimeMs(execResult.getRuntimeMs())
                        .memoryKb(execResult.getMemoryKb())
                        .passed(passed)
                        .build());
            }

            RunCodeResponse.RunCodeItemResult firstItem = !itemResults.isEmpty() ? itemResults.getFirst() : null;

            return RunCodeResponse.builder()
                    .verdict(overallVerdict)
                    .runtimeMs(maxRuntimeMs)
                    .memoryKb(maxMemoryKb)
                    .passCount(passCount)
                    .totalCount(sampleTestCases.size())
                    .sampleResults(itemResults)
                    .input(firstItem != null ? firstItem.getInput() : null)
                    .output(firstItem != null ? firstItem.getActualOutput() : null)
                    .expectedOutput(firstItem != null ? firstItem.getExpectedOutput() : null)
                    .passed(passCount == sampleTestCases.size())
                    .build();

        } catch (Exception e) {
            log.error("Internal error running sample tests: {}", e.getMessage(), e);
            return RunCodeResponse.builder()
                    .verdict(Verdict.INTERNAL_ERROR)
                    .errorLog("Lỗi hệ thống khi chạy thử code: " + e.getMessage())
                    .passCount(0)
                    .totalCount(sampleTestCases.size())
                    .sampleResults(List.of())
                    .passed(false)
                    .build();
        } finally {
            if (workDir != null) {
                dockerExecutor.cleanupWorkDir(workDir);
            }
        }
    }

    private Verdict compareOutput(String actualOutput, String expectedOutput) {
        if (actualOutput == null) actualOutput = "";
        if (expectedOutput == null) expectedOutput = "";

        String actual = actualOutput.replace("\r\n", "\n").stripTrailing();
        String expected = expectedOutput.replace("\r\n", "\n").stripTrailing();

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

        // Cache finished submission in Redis & evict recent list cache
        try {
            submissionRedisService.saveSubmission(mapper.toSubmissionResponse(submission));
            submissionRedisService.evictRecentSubmissions();
        } catch (Exception e) {
            log.warn("Failed to update submission cache for submission {}", submission.getId(), e);
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