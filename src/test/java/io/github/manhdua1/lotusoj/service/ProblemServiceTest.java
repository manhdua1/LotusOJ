package io.github.manhdua1.lotusoj.service;

import io.github.manhdua1.lotusoj.dto.request.problem.CreateProblemRequest;
import io.github.manhdua1.lotusoj.dto.request.problem.ProblemFilterRequest;
import io.github.manhdua1.lotusoj.dto.request.problem.UpdateProblemRequest;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemDetailResponse;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemStatResponse;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemSummaryResponse;
import io.github.manhdua1.lotusoj.dto.response.testCase.TestCaseResponse;
import io.github.manhdua1.lotusoj.entity.auth.User;
import io.github.manhdua1.lotusoj.entity.problem.Problem;
import io.github.manhdua1.lotusoj.entity.problem.Tag;
import io.github.manhdua1.lotusoj.entity.testCase.TestCase;
import io.github.manhdua1.lotusoj.exception.AppException;
import io.github.manhdua1.lotusoj.exception.ErrorCode;
import io.github.manhdua1.lotusoj.mapper.ProblemMapper;
import io.github.manhdua1.lotusoj.mapper.TestCaseMapper;
import io.github.manhdua1.lotusoj.repository.auth.UserRepository;
import io.github.manhdua1.lotusoj.repository.problem.ProblemRepository;
import io.github.manhdua1.lotusoj.repository.problem.TagRepository;
import io.github.manhdua1.lotusoj.repository.testCase.TestCaseRepository;
import io.github.manhdua1.lotusoj.service.problem.ProblemRedisService;
import io.github.manhdua1.lotusoj.service.problem.impl.ProblemServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProblemServiceTest {

    @Mock
    private ProblemRepository problemRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private TestCaseRepository testCaseRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProblemMapper problemMapper;

    @Mock
    private TestCaseMapper testCaseMapper;

    @Mock
    private ProblemRedisService problemRedisService;

    @InjectMocks
    private ProblemServiceImpl problemService;

    private User ownerUser;
    private User otherUser;
    private User adminUser;
    private Problem sampleProblem;
    private Tag sampleTag;
    private TestCase sampleTestCase;

    @BeforeEach
    void setUp() {
        ownerUser = User.builder()
                .id(UUID.randomUUID())
                .email("setter@example.com")
                .username("setter")
                .role(User.Role.PROBLEM_SETTER)
                .build();

        otherUser = User.builder()
                .id(UUID.randomUUID())
                .email("user@example.com")
                .username("user")
                .role(User.Role.USER)
                .build();

        adminUser = User.builder()
                .id(UUID.randomUUID())
                .email("admin@example.com")
                .username("admin")
                .role(User.Role.ADMIN)
                .build();

        sampleTag = Tag.builder()
                .id(UUID.randomUUID())
                .name("Dynamic Programming")
                .build();

        sampleProblem = Problem.builder()
                .id(UUID.randomUUID())
                .slug("two-sum")
                .title("Two Sum")
                .statement("Given an array of integers...")
                .timeLimitMs(1000)
                .memoryLimitKb(256)
                .difficulty(Problem.ProblemDifficulty.EASY)
                .status(Problem.ProblemStatus.PUBLISHED)
                .tags(new HashSet<>(Collections.singletonList(sampleTag)))
                .createdBy(ownerUser)
                .totalSubmissions(100)
                .totalAccepted(50)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        sampleTestCase = TestCase.builder()
                .id(UUID.randomUUID())
                .problem(sampleProblem)
                .input("2 7 11 15\n9")
                .expectedOutput("0 1")
                .isSample(true)
                .orderIndex(1)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateUser(User user) {
        var auth = new UsernamePasswordAuthenticationToken(user.getEmail(), null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
        lenient().when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }

    @Nested
    @DisplayName("createProblem tests")
    class CreateProblemTests {

        @Test
        @DisplayName("Should successfully create a problem and resolve tags")
        void createProblem_success() {
            authenticateUser(ownerUser);

            CreateProblemRequest request = CreateProblemRequest.builder()
                    .title("Two Sum")
                    .statement("Find two numbers...")
                    .timeLimitMs(1000)
                    .memoryLimitKb(256)
                    .difficulty(Problem.ProblemDifficulty.EASY)
                    .tagNames(List.of("Dynamic Programming", "NewTag"))
                    .build();

            Problem newProblem = Problem.builder()
                    .title(request.getTitle())
                    .statement(request.getStatement())
                    .timeLimitMs(request.getTimeLimitMs())
                    .memoryLimitKb(request.getMemoryLimitKb())
                    .difficulty(request.getDifficulty())
                    .build();

            ProblemDetailResponse detailResponse = ProblemDetailResponse.builder()
                    .id(sampleProblem.getId())
                    .title(sampleProblem.getTitle())
                    .slug(sampleProblem.getSlug())
                    .tags(List.of("Dynamic Programming", "NewTag"))
                    .build();

            when(problemMapper.toProblem(request)).thenReturn(newProblem);
            when(problemRepository.existsBySlug(anyString())).thenReturn(false);
            when(tagRepository.findByNameIgnoreCase("Dynamic Programming")).thenReturn(Optional.of(sampleTag));
            when(tagRepository.findByNameIgnoreCase("NewTag")).thenReturn(Optional.empty());
            when(tagRepository.save(any(Tag.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(problemRepository.save(any(Problem.class))).thenReturn(sampleProblem);
            when(problemMapper.toProblemDetailResponse(sampleProblem)).thenReturn(detailResponse);
            when(testCaseRepository.findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(sampleProblem.getId()))
                    .thenReturn(Collections.singletonList(sampleTestCase));
            when(testCaseMapper.toTestCaseResponseList(anyList()))
                    .thenReturn(Collections.singletonList(TestCaseResponse.builder().id(sampleTestCase.getId()).isSample(true).build()));

            ProblemDetailResponse response = problemService.createProblem(request);

            assertNotNull(response);
            assertEquals("Two Sum", response.getTitle());
            verify(problemRepository, times(1)).save(any(Problem.class));
            verify(tagRepository, times(1)).save(any(Tag.class));
        }

        @Test
        @DisplayName("Should throw UNAUTHENTICATED when no user in SecurityContext")
        void createProblem_unauthenticated_throwsException() {
            SecurityContextHolder.clearContext();

            CreateProblemRequest request = CreateProblemRequest.builder()
                    .title("Two Sum")
                    .build();

            AppException exception = assertThrows(AppException.class, () -> problemService.createProblem(request));
            assertEquals(ErrorCode.UNAUTHENTICATED, exception.getErrorCode());
        }
    }

    @Nested
    @DisplayName("updateProblem tests")
    class UpdateProblemTests {

        @Test
        @DisplayName("Should successfully update problem when user is the owner")
        void updateProblem_byOwner_success() {
            authenticateUser(ownerUser);

            UpdateProblemRequest request = UpdateProblemRequest.builder()
                    .title("Two Sum Updated")
                    .timeLimitMs(2000)
                    .tagNames(List.of("Dynamic Programming"))
                    .build();

            ProblemDetailResponse detailResponse = ProblemDetailResponse.builder()
                    .id(sampleProblem.getId())
                    .title("Two Sum Updated")
                    .build();

            when(problemRepository.findByIdAndIsDeletedFalse(sampleProblem.getId())).thenReturn(Optional.of(sampleProblem));
            when(problemRepository.existsBySlugAndIdNot(anyString(), eq(sampleProblem.getId()))).thenReturn(false);
            when(tagRepository.findByNameIgnoreCase("Dynamic Programming")).thenReturn(Optional.of(sampleTag));
            when(problemRepository.save(any(Problem.class))).thenReturn(sampleProblem);
            when(problemMapper.toProblemDetailResponse(sampleProblem)).thenReturn(detailResponse);
            when(testCaseRepository.findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(sampleProblem.getId()))
                    .thenReturn(Collections.emptyList());

            ProblemDetailResponse response = problemService.updateProblem(sampleProblem.getId(), request);

            assertNotNull(response);
            assertEquals("Two Sum Updated", response.getTitle());
            verify(problemMapper, times(1)).updateProblemFromDto(request, sampleProblem);
            verify(problemRepository, times(1)).save(sampleProblem);
        }

        @Test
        @DisplayName("Should throw UNAUTHORIZED_OPERATION when user is not owner and not admin")
        void updateProblem_byOtherUser_throwsException() {
            authenticateUser(otherUser);

            UpdateProblemRequest request = UpdateProblemRequest.builder()
                    .title("Two Sum Updated")
                    .build();

            when(problemRepository.findByIdAndIsDeletedFalse(sampleProblem.getId())).thenReturn(Optional.of(sampleProblem));

            AppException exception = assertThrows(AppException.class,
                    () -> problemService.updateProblem(sampleProblem.getId(), request));

            assertEquals(ErrorCode.UNAUTHORIZED_OPERATION, exception.getErrorCode());
            verify(problemRepository, never()).save(any(Problem.class));
        }

        @Test
        @DisplayName("Should throw PROBLEM_NOT_FOUND when problem does not exist")
        void updateProblem_notFound_throwsException() {
            authenticateUser(ownerUser);
            UUID nonExistentId = UUID.randomUUID();

            when(problemRepository.findByIdAndIsDeletedFalse(nonExistentId)).thenReturn(Optional.empty());

            AppException exception = assertThrows(AppException.class,
                    () -> problemService.updateProblem(nonExistentId, new UpdateProblemRequest()));

            assertEquals(ErrorCode.PROBLEM_NOT_FOUND, exception.getErrorCode());
        }
    }

    @Nested
    @DisplayName("getProblemById and getProblemBySlug tests")
    class GetProblemTests {

        @Test
        @DisplayName("Should successfully return problem details for published problem")
        void getProblemById_published_success() {
            ProblemDetailResponse detailResponse = ProblemDetailResponse.builder()
                    .id(sampleProblem.getId())
                    .title(sampleProblem.getTitle())
                    .slug(sampleProblem.getSlug())
                    .acceptanceRate(50.0)
                    .build();

            when(problemRepository.findByIdAndIsDeletedFalse(sampleProblem.getId())).thenReturn(Optional.of(sampleProblem));
            when(problemMapper.toProblemDetailResponse(sampleProblem)).thenReturn(detailResponse);
            when(testCaseRepository.findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(sampleProblem.getId()))
                    .thenReturn(Collections.singletonList(sampleTestCase));
            when(testCaseMapper.toTestCaseResponseList(anyList()))
                    .thenReturn(Collections.singletonList(TestCaseResponse.builder().id(sampleTestCase.getId()).isSample(true).build()));

            ProblemDetailResponse response = problemService.getProblemById(sampleProblem.getId());

            assertNotNull(response);
            assertEquals(sampleProblem.getTitle(), response.getTitle());
            assertNotNull(response.getSampleTestCases());
            assertEquals(1, response.getSampleTestCases().size());
        }

        @Test
        @DisplayName("Should throw PROBLEM_NOT_FOUND when draft problem is viewed by unauthorized user")
        void getProblemById_draft_byNormalUser_throwsException() {
            sampleProblem.setStatus(Problem.ProblemStatus.DRAFT);
            authenticateUser(otherUser);

            when(problemRepository.findByIdAndIsDeletedFalse(sampleProblem.getId())).thenReturn(Optional.of(sampleProblem));

            AppException exception = assertThrows(AppException.class,
                    () -> problemService.getProblemById(sampleProblem.getId()));

            assertEquals(ErrorCode.PROBLEM_NOT_FOUND, exception.getErrorCode());
        }

        @Test
        @DisplayName("Should return draft problem when viewed by creator")
        void getProblemById_draft_byOwner_success() {
            sampleProblem.setStatus(Problem.ProblemStatus.DRAFT);
            authenticateUser(ownerUser);

            ProblemDetailResponse detailResponse = ProblemDetailResponse.builder()
                    .id(sampleProblem.getId())
                    .title(sampleProblem.getTitle())
                    .status(Problem.ProblemStatus.DRAFT)
                    .build();

            when(problemRepository.findByIdAndIsDeletedFalse(sampleProblem.getId())).thenReturn(Optional.of(sampleProblem));
            when(problemMapper.toProblemDetailResponse(sampleProblem)).thenReturn(detailResponse);
            when(testCaseRepository.findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(sampleProblem.getId()))
                    .thenReturn(Collections.emptyList());

            ProblemDetailResponse response = problemService.getProblemById(sampleProblem.getId());

            assertNotNull(response);
            assertEquals(Problem.ProblemStatus.DRAFT, response.getStatus());
        }

        @Test
        @DisplayName("Should successfully return problem details by slug")
        void getProblemBySlug_success() {
            ProblemDetailResponse detailResponse = ProblemDetailResponse.builder()
                    .id(sampleProblem.getId())
                    .slug(sampleProblem.getSlug())
                    .build();

            when(problemRepository.findBySlugAndIsDeletedFalse(sampleProblem.getSlug())).thenReturn(Optional.of(sampleProblem));
            when(problemMapper.toProblemDetailResponse(sampleProblem)).thenReturn(detailResponse);
            when(testCaseRepository.findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(sampleProblem.getId()))
                    .thenReturn(Collections.emptyList());

            ProblemDetailResponse response = problemService.getProblemBySlug(sampleProblem.getSlug());

            assertNotNull(response);
            assertEquals(sampleProblem.getSlug(), response.getSlug());
        }
    }

    @Nested
    @DisplayName("getProblems filtering tests")
    class GetProblemsTests {

        @Test
        @DisplayName("Should return page of ProblemSummaryResponse with published filter for normal user")
        void getProblems_normalUser_filtersPublished() {
            authenticateUser(otherUser);

            ProblemFilterRequest filter = ProblemFilterRequest.builder()
                    .keyword("Two")
                    .build();
            Pageable pageable = PageRequest.of(0, 10);

            ProblemSummaryResponse summaryResponse = ProblemSummaryResponse.builder()
                    .id(sampleProblem.getId())
                    .title(sampleProblem.getTitle())
                    .acceptanceRate(50.0)
                    .build();

            Page<Problem> problemPage = new PageImpl<>(List.of(sampleProblem), pageable, 1);
            when(problemRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(problemPage);
            when(problemMapper.toProblemSummaryResponse(sampleProblem)).thenReturn(summaryResponse);

            Page<ProblemSummaryResponse> result = problemService.getProblems(filter, pageable);

            assertNotNull(result);
            assertEquals(1, result.getTotalElements());
            assertEquals(sampleProblem.getTitle(), result.getContent().get(0).getTitle());
            assertFalse(result.getContent().get(0).getSolvedByCurrentUser());
        }
    }

    @Nested
    @DisplayName("deleteProblem & updateProblemStatus tests")
    class DeleteAndStatusTests {

        @Test
        @DisplayName("Should soft delete problem when user is owner")
        void deleteProblem_byOwner_success() {
            authenticateUser(ownerUser);

            when(problemRepository.findByIdAndIsDeletedFalse(sampleProblem.getId())).thenReturn(Optional.of(sampleProblem));
            when(problemRepository.save(sampleProblem)).thenReturn(sampleProblem);

            problemService.deleteProblem(sampleProblem.getId());

            assertTrue(sampleProblem.getIsDeleted());
            verify(problemRepository, times(1)).save(sampleProblem);
        }

        @Test
        @DisplayName("Should update problem status successfully")
        void updateProblemStatus_success() {
            authenticateUser(ownerUser);

            ProblemDetailResponse detailResponse = ProblemDetailResponse.builder()
                    .id(sampleProblem.getId())
                    .status(Problem.ProblemStatus.ARCHIVED)
                    .build();

            when(problemRepository.findByIdAndIsDeletedFalse(sampleProblem.getId())).thenReturn(Optional.of(sampleProblem));
            when(problemRepository.save(sampleProblem)).thenReturn(sampleProblem);
            when(problemMapper.toProblemDetailResponse(sampleProblem)).thenReturn(detailResponse);
            when(testCaseRepository.findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(sampleProblem.getId()))
                    .thenReturn(Collections.emptyList());

            ProblemDetailResponse response = problemService.updateProblemStatus(sampleProblem.getId(), Problem.ProblemStatus.ARCHIVED);

            assertNotNull(response);
            assertEquals(Problem.ProblemStatus.ARCHIVED, response.getStatus());
            assertEquals(Problem.ProblemStatus.ARCHIVED, sampleProblem.getStatus());
        }

        @Test
        @DisplayName("Should return problem statistics")
        void getProblemStats_success() {
            when(problemRepository.findByIdAndIsDeletedFalse(sampleProblem.getId())).thenReturn(Optional.of(sampleProblem));
            when(problemMapper.calculateAcceptanceRate(sampleProblem)).thenReturn(50.0);

            ProblemStatResponse stats = problemService.getProblemStats(sampleProblem.getId());

            assertNotNull(stats);
            assertEquals(sampleProblem.getId(), stats.getProblemId());
            assertEquals(100, stats.getTotalSubmissions());
            assertEquals(50, stats.getTotalAccepted());
            assertEquals(50.0, stats.getAcceptanceRate());
        }
    }
}
