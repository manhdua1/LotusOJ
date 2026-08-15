package io.github.manhdua1.lotusoj.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.manhdua1.lotusoj.dto.request.problem.CreateProblemRequest;
import io.github.manhdua1.lotusoj.dto.request.problem.ProblemFilterRequest;
import io.github.manhdua1.lotusoj.dto.request.problem.UpdateProblemRequest;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemDetailResponse;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemStatResponse;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemSummaryResponse;
import io.github.manhdua1.lotusoj.entity.problem.Problem;
import io.github.manhdua1.lotusoj.exception.GlobalExceptionHandler;
import io.github.manhdua1.lotusoj.service.problem.ProblemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ProblemControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ProblemService problemService;

    @InjectMocks
    private ProblemController problemController;

    private UUID problemId;
    private ProblemDetailResponse sampleDetailResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(problemController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();

        problemId = UUID.randomUUID();

        sampleDetailResponse = ProblemDetailResponse.builder()
                .id(problemId)
                .slug("two-sum")
                .title("Two Sum")
                .statement("Given an array...")
                .timeLimitMs(1000)
                .memoryLimitKb(256)
                .difficulty(Problem.ProblemDifficulty.EASY)
                .status(Problem.ProblemStatus.PUBLISHED)
                .tags(List.of("Array", "Hash Table"))
                .acceptanceRate(65.5)
                .build();
    }

    @Test
    @DisplayName("POST /api/problems - Should successfully create a problem")
    void createProblem_success() throws Exception {
        CreateProblemRequest request = CreateProblemRequest.builder()
                .title("Two Sum")
                .statement("Given an array...")
                .timeLimitMs(1000)
                .memoryLimitKb(256)
                .difficulty(Problem.ProblemDifficulty.EASY)
                .tagNames(List.of("Array", "Hash Table"))
                .build();

        when(problemService.createProblem(any(CreateProblemRequest.class))).thenReturn(sampleDetailResponse);

        mockMvc.perform(post("/api/problems")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value(problemId.toString()))
                .andExpect(jsonPath("$.result.title").value("Two Sum"))
                .andExpect(jsonPath("$.result.slug").value("two-sum"));

        verify(problemService, times(1)).createProblem(any(CreateProblemRequest.class));
    }

    @Test
    @DisplayName("PUT /api/problems/{id} - Should successfully update a problem")
    void updateProblem_success() throws Exception {
        UpdateProblemRequest request = UpdateProblemRequest.builder()
                .title("Two Sum Updated")
                .timeLimitMs(2000)
                .build();

        when(problemService.updateProblem(eq(problemId), any(UpdateProblemRequest.class))).thenReturn(sampleDetailResponse);

        mockMvc.perform(put("/api/problems/{id}", problemId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value(problemId.toString()));

        verify(problemService, times(1)).updateProblem(eq(problemId), any(UpdateProblemRequest.class));
    }

    @Test
    @DisplayName("GET /api/problems/{id} - Should return problem detail by ID")
    void getProblemById_success() throws Exception {
        when(problemService.getProblemById(problemId)).thenReturn(sampleDetailResponse);

        mockMvc.perform(get("/api/problems/{id}", problemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value(problemId.toString()))
                .andExpect(jsonPath("$.result.title").value("Two Sum"));

        verify(problemService, times(1)).getProblemById(problemId);
    }

    @Test
    @DisplayName("GET /api/problems/slug/{slug} - Should return problem detail by slug")
    void getProblemBySlug_success() throws Exception {
        when(problemService.getProblemBySlug("two-sum")).thenReturn(sampleDetailResponse);

        mockMvc.perform(get("/api/problems/slug/{slug}", "two-sum"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.slug").value("two-sum"));

        verify(problemService, times(1)).getProblemBySlug("two-sum");
    }

    @Test
    @DisplayName("GET /api/problems - Should return paginated problem summaries")
    void getProblems_success() throws Exception {
        ProblemSummaryResponse summary = ProblemSummaryResponse.builder()
                .id(problemId)
                .slug("two-sum")
                .title("Two Sum")
                .difficulty(Problem.ProblemDifficulty.EASY)
                .tags(List.of("Array"))
                .acceptanceRate(65.5)
                .solvedByCurrentUser(false)
                .build();

        Page<ProblemSummaryResponse> page = new PageImpl<>(Collections.singletonList(summary));
        when(problemService.getProblems(any(ProblemFilterRequest.class), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/problems")
                        .param("keyword", "Two")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content[0].title").value("Two Sum"))
                .andExpect(jsonPath("$.result.totalElements").value(1))
                .andExpect(jsonPath("$.result.page").value(0))
                .andExpect(jsonPath("$.result.size").value(1));

        verify(problemService, times(1)).getProblems(any(ProblemFilterRequest.class), any(Pageable.class));
    }

    @Test
    @DisplayName("DELETE /api/problems/{id} - Should soft delete problem")
    void deleteProblem_success() throws Exception {
        doNothing().when(problemService).deleteProblem(problemId);

        mockMvc.perform(delete("/api/problems/{id}", problemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));

        verify(problemService, times(1)).deleteProblem(problemId);
    }

    @Test
    @DisplayName("PATCH /api/problems/{id}/status - Should update status")
    void updateProblemStatus_success() throws Exception {
        when(problemService.updateProblemStatus(eq(problemId), eq(Problem.ProblemStatus.ARCHIVED)))
                .thenReturn(sampleDetailResponse);

        mockMvc.perform(patch("/api/problems/{id}/status", problemId)
                        .param("status", "ARCHIVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));

        verify(problemService, times(1)).updateProblemStatus(eq(problemId), eq(Problem.ProblemStatus.ARCHIVED));
    }

    @Test
    @DisplayName("GET /api/problems/{id}/stats - Should return problem stats")
    void getProblemStats_success() throws Exception {
        ProblemStatResponse statResponse = ProblemStatResponse.builder()
                .problemId(problemId)
                .totalSubmissions(150)
                .totalAccepted(100)
                .acceptanceRate(66.67)
                .submissionsByLanguage(Collections.emptyMap())
                .build();

        when(problemService.getProblemStats(problemId)).thenReturn(statResponse);

        mockMvc.perform(get("/api/problems/{id}/stats", problemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.problemId").value(problemId.toString()))
                .andExpect(jsonPath("$.result.totalSubmissions").value(150))
                .andExpect(jsonPath("$.result.totalAccepted").value(100));

        verify(problemService, times(1)).getProblemStats(problemId);
    }
}
