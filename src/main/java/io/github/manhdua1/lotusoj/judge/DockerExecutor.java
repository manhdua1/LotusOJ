package io.github.manhdua1.lotusoj.judge;

import io.github.manhdua1.lotusoj.entity.submission.Language;
import io.github.manhdua1.lotusoj.entity.submission.Verdict;
import io.github.manhdua1.lotusoj.judge.dto.CompileResult;
import io.github.manhdua1.lotusoj.judge.dto.ExecutionResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Executes user-submitted code inside Docker containers with strict
 * resource limits (CPU time, memory, no network).
 *
 * <h3>Flow</h3>
 * <ol>
 *   <li>{@link #compile} – compiles source code (skipped for interpreted languages)</li>
 *   <li>{@link #execute} – runs the compiled binary / script with a single test-case input</li>
 * </ol>
 *
 * <h3>Docker images expected</h3>
 * <ul>
 *   <li><code>gcc:13.2</code> – C / C++</li>
 *   <li><code>openjdk:17-slim</code> – Java</li>
 *   <li><code>python:3.11-slim</code> – Python</li>
 *   <li><code>mcr.microsoft.com/dotnet/sdk:8.0</code> – C#</li>
 * </ul>
 */
@Slf4j
@Component
public class DockerExecutor {

    private static final int OUTPUT_LIMIT_BYTES = 256 * 1024; // 256 KB
    private static final int COMPILE_TIMEOUT_SECONDS = 30;

    // ────────────────────────────────────────────────────────────────
    //  COMPILE
    // ────────────────────────────────────────────────────────────────

    /**
     * Compiles the source code inside a Docker container.
     * For interpreted languages (Python) this is a no-op that returns success.
     *
     * @param language   the programming language
     * @param sourceCode raw source code text
     * @param workDir    host directory where the source file + compiled artefact will live
     * @return compile result (success / CE with error log)
     */
    public CompileResult compile(Language language, String sourceCode, Path workDir) throws IOException, InterruptedException {
        // Python – nothing to compile
        if (language == Language.PYTHON) {
            String fileName = "solution" + language.getFileExtension();
            Files.writeString(workDir.resolve(fileName), sourceCode);
            return CompileResult.builder().success(true).build();
        }

        // Write source file
        String fileName = getSourceFileName(language);
        Files.writeString(workDir.resolve(fileName), sourceCode);

        // Build docker run command for compilation
        List<String> cmd = buildCompileCommand(language, workDir);
        log.debug("Compile command: {}", cmd);

        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        String output = readLimited(process.getInputStream(), OUTPUT_LIMIT_BYTES);
        boolean finished = process.waitFor(COMPILE_TIMEOUT_SECONDS, TimeUnit.SECONDS);

        if (!finished) {
            process.destroyForcibly();
            return CompileResult.builder()
                    .success(false)
                    .verdict(Verdict.COMPILATION_ERROR)
                    .errorLog("Compilation timed out after " + COMPILE_TIMEOUT_SECONDS + "s")
                    .build();
        }

        int exitCode = process.exitValue();
        if (exitCode != 0) {
            return CompileResult.builder()
                    .success(false)
                    .verdict(Verdict.COMPILATION_ERROR)
                    .errorLog(output.length() > 4096 ? output.substring(0, 4096) : output)
                    .build();
        }

        return CompileResult.builder().success(true).build();
    }

    // ────────────────────────────────────────────────────────────────
    //  EXECUTE
    // ────────────────────────────────────────────────────────────────

    /**
     * Runs the compiled program (or interpreted script) in a Docker container
     * with the given test-case input.
     *
     * @param language      the programming language
     * @param workDir       host directory containing compiled artefact / source
     * @param input         test-case input (fed to stdin)
     * @param timeLimitMs   time limit in milliseconds
     * @param memoryLimitKb memory limit in kilobytes
     * @return execution result
     */
    public ExecutionResult execute(Language language, Path workDir, String input,
                                   int timeLimitMs, int memoryLimitKb) throws IOException, InterruptedException {

        List<String> cmd = buildRunCommand(language, workDir, timeLimitMs, memoryLimitKb);
        log.debug("Run command: {}", cmd);

        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.redirectErrorStream(false);
        long startTime = System.currentTimeMillis();
        Process process = pb.start();

        // Write input to stdin
        try (OutputStream os = process.getOutputStream()) {
            if (input != null && !input.isEmpty()) {
                os.write(input.getBytes(StandardCharsets.UTF_8));
            }
            os.flush();
        }

        // Read stdout and stderr in parallel to prevent blocking
        StringBuilder stdoutBuilder = new StringBuilder();
        StringBuilder stderrBuilder = new StringBuilder();

        Thread stdoutThread = Thread.ofVirtual().start(() -> {
            try {
                stdoutBuilder.append(readLimited(process.getInputStream(), OUTPUT_LIMIT_BYTES));
            } catch (IOException e) {
                log.warn("Error reading stdout", e);
            }
        });

        Thread stderrThread = Thread.ofVirtual().start(() -> {
            try {
                stderrBuilder.append(readLimited(process.getErrorStream(), OUTPUT_LIMIT_BYTES));
            } catch (IOException e) {
                log.warn("Error reading stderr", e);
            }
        });

        // Wait with extra buffer for Docker overhead
        int waitSeconds = (timeLimitMs / 1000) + 5;
        boolean finished = process.waitFor(waitSeconds, TimeUnit.SECONDS);

        stdoutThread.join(2000);
        stderrThread.join(2000);

        long elapsedMs = System.currentTimeMillis() - startTime;
        int executionRuntimeMs = (int) Math.min(elapsedMs, (long) timeLimitMs);

        if (!finished) {
            process.destroyForcibly();
            return ExecutionResult.builder()
                    .verdict(Verdict.TIME_LIMIT_EXCEEDED)
                    .runtimeMs(timeLimitMs)
                    .errorMessage("Process killed: time limit exceeded")
                    .build();
        }

        int exitCode = process.exitValue();
        String stdout = stdoutBuilder.toString();
        String stderr = stderrBuilder.toString();

        // Docker returns exit code 137 for OOM kill (SIGKILL)
        if (exitCode == 137) {
            return ExecutionResult.builder()
                    .verdict(Verdict.MEMORY_LIMIT_EXCEEDED)
                    .runtimeMs(executionRuntimeMs)
                    .errorMessage("Process killed: memory limit exceeded (OOM)")
                    .build();
        }

        // Exit code 124 = timeout from the `timeout` command inside the container
        if (exitCode == 124) {
            return ExecutionResult.builder()
                    .verdict(Verdict.TIME_LIMIT_EXCEEDED)
                    .runtimeMs(timeLimitMs)
                    .errorMessage("Time limit exceeded")
                    .build();
        }

        // Output too large
        if (stdout.length() >= OUTPUT_LIMIT_BYTES) {
            return ExecutionResult.builder()
                    .verdict(Verdict.OUTPUT_LIMIT_EXCEEDED)
                    .runtimeMs(executionRuntimeMs)
                    .output(stdout.substring(0, 1024))
                    .errorMessage("Output exceeded " + OUTPUT_LIMIT_BYTES + " bytes")
                    .build();
        }

        // Runtime error (non-zero exit)
        if (exitCode != 0) {
            return ExecutionResult.builder()
                    .verdict(Verdict.RUNTIME_ERROR)
                    .runtimeMs(executionRuntimeMs)
                    .output(stdout)
                    .errorMessage(stderr.length() > 2048 ? stderr.substring(0, 2048) : stderr)
                    .build();
        }

        // Success – caller will compare output with expected answer
        return ExecutionResult.builder()
                .verdict(Verdict.ACCEPTED)
                .runtimeMs(executionRuntimeMs)
                .output(stdout)
                .build();
    }

    // ────────────────────────────────────────────────────────────────
    //  CLEANUP
    // ────────────────────────────────────────────────────────────────

    /**
     * Creates a temporary working directory for a submission.
     */
    public Path createWorkDir() throws IOException {
        return Files.createTempDirectory("oj-submission-");
    }

    /**
     * Deletes the temporary working directory and all its contents.
     */
    public void cleanupWorkDir(Path workDir) {
        if (workDir == null) return;
        try (var paths = Files.walk(workDir)) {
            paths.sorted(Comparator.reverseOrder())
                    .forEach(p -> {
                        try { Files.deleteIfExists(p); } catch (IOException ignored) {}
                    });
        } catch (IOException e) {
            log.warn("Failed to cleanup work dir: {}", workDir, e);
        }
    }

    // ────────────────────────────────────────────────────────────────
    //  PRIVATE HELPERS
    // ────────────────────────────────────────────────────────────────

    private String getSourceFileName(Language language) {
        return switch (language) {
            case JAVA -> "Main.java";
            default -> "solution" + language.getFileExtension();
        };
    }

    private String getDockerImage(Language language) {
        return switch (language) {
            case CPP, C -> "gcc:13.2";
            case JAVA -> "eclipse-temurin:17-jdk-alpine";
            case PYTHON -> "python:3.11-slim";
            case CSHARP -> "mcr.microsoft.com/dotnet/sdk:8.0";
        };
    }

    private List<String> buildCompileCommand(Language language, Path workDir) {
        List<String> cmd = new ArrayList<>();
        cmd.add("docker");
        cmd.add("run");
        cmd.add("--rm");
        cmd.add("--network=none");
        cmd.add("--memory=512m");
        cmd.add("--cpus=1");
        cmd.add("-v");
        cmd.add(workDir.toAbsolutePath() + ":/workspace");
        cmd.add("-w");
        cmd.add("/workspace");
        cmd.add(getDockerImage(language));

        switch (language) {
            case CPP -> {
                cmd.add("g++");
                cmd.addAll(List.of("-std=c++17", "-O2", "-o", "solution", "solution.cpp"));
            }
            case C -> {
                cmd.add("gcc");
                cmd.addAll(List.of("-std=c17", "-O2", "-o", "solution", "solution.c"));
            }
            case JAVA -> {
                cmd.add("javac");
                cmd.add("Main.java");
            }
            case CSHARP -> {
                cmd.add("sh");
                cmd.add("-c");
                cmd.add("dotnet new console -o /workspace/build --force > /dev/null 2>&1 && " +
                        "cp /workspace/solution.cs /workspace/build/Program.cs && " +
                        "dotnet build /workspace/build -o /workspace/out -c Release --nologo -v q");
            }
            default -> throw new IllegalArgumentException("Unsupported language for compilation: " + language);
        }
        return cmd;
    }

    private List<String> buildRunCommand(Language language, Path workDir,
                                         int timeLimitMs, int memoryLimitKb) {
        long memoryBytes = (long) memoryLimitKb * 1024;
        long containerMemoryBytes = (language == Language.JAVA)
                ? memoryBytes + 128L * 1024 * 1024 // Add 128MB overhead for JVM metaspace & runtime
                : memoryBytes;
        int timeLimitSeconds = Math.max(1, (timeLimitMs + 999) / 1000); // round up

        List<String> cmd = new ArrayList<>();
        cmd.add("docker");
        cmd.add("run");
        cmd.add("--rm");
        cmd.add("-i");                                      // interactive (stdin)
        cmd.add("--network=none");                          // no network access
        cmd.add("--memory=" + containerMemoryBytes);        // memory limit
        cmd.add("--memory-swap=" + containerMemoryBytes);   // no swap
        cmd.add("--cpus=1");                                // single CPU
        cmd.add("--pids-limit=64");                         // limit process forks
        cmd.add("--read-only");                             // read-only root filesystem
        cmd.add("--tmpfs=/tmp:rw,size=64m,noexec");         // writable /tmp for runtime needs
        cmd.add("-v");
        cmd.add(workDir.toAbsolutePath() + ":/workspace:ro");  // mount workspace read-only
        cmd.add("-w");
        cmd.add("/workspace");
        cmd.add(getDockerImage(language));

        // Use `timeout` to enforce wall-clock time limit inside the container
        cmd.add("timeout");
        cmd.add(String.valueOf(timeLimitSeconds));

        switch (language) {
            case CPP, C -> cmd.add("./solution");
            case JAVA -> {
                cmd.add("java");
                cmd.add("-Xmx" + memoryLimitKb + "k");
                cmd.add("Main");
            }
            case PYTHON -> {
                cmd.add("python3");
                cmd.add("solution.py");
            }
            case CSHARP -> {
                cmd.add("dotnet");
                cmd.add("/workspace/out/build.dll");
            }
        }
        return cmd;
    }

    /**
     * Reads from an InputStream up to {@code maxBytes} bytes,
     * returning the result as a String.
     */
    private String readLimited(java.io.InputStream is, int maxBytes) throws IOException {
        byte[] buffer = new byte[4096];
        int totalRead = 0;
        var baos = new java.io.ByteArrayOutputStream();
        int n;
        while ((n = is.read(buffer)) != -1) {
            int remaining = maxBytes - totalRead;
            if (remaining <= 0) break;
            int toWrite = Math.min(n, remaining);
            baos.write(buffer, 0, toWrite);
            totalRead += toWrite;
        }
        return baos.toString(StandardCharsets.UTF_8);
    }
}
