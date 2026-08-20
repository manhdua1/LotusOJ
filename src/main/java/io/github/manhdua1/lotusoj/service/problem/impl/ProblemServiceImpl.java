package io.github.manhdua1.lotusoj.service.problem.impl;

import io.github.manhdua1.lotusoj.dto.request.problem.CreateProblemRequest;
import io.github.manhdua1.lotusoj.dto.request.problem.ProblemFilterRequest;
import io.github.manhdua1.lotusoj.dto.request.problem.UpdateProblemRequest;
import io.github.manhdua1.lotusoj.dto.response.PageResponse;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemDetailResponse;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemStatResponse;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemSummaryResponse;
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
import io.github.manhdua1.lotusoj.repository.problem.ProblemSpecification;
import io.github.manhdua1.lotusoj.repository.problem.TagRepository;
import io.github.manhdua1.lotusoj.repository.testCase.TestCaseRepository;
import io.github.manhdua1.lotusoj.service.problem.ProblemRedisService;
import io.github.manhdua1.lotusoj.service.problem.ProblemService;
import io.github.manhdua1.lotusoj.util.SlugUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProblemServiceImpl implements ProblemService {

    ProblemRepository problemRepository;
    TagRepository tagRepository;
    TestCaseRepository testCaseRepository;
    UserRepository userRepository;
    ProblemMapper problemMapper;
    TestCaseMapper testCaseMapper;
    ProblemRedisService problemRedisService;

    @Override
    @Transactional
    public ProblemDetailResponse createProblem(CreateProblemRequest request) {
        User currentUser = getCurrentUser();

        Problem problem = problemMapper.toProblem(request);
        problem.setSlug(generateUniqueSlug(request.getTitle(), null));
        problem.setTags(resolveTags(request.getTagNames()));
        problem.setCreatedBy(currentUser);
        problem.setStatus(Problem.ProblemStatus.DRAFT);
        problem.setTotalSubmissions(0);
        problem.setTotalAccepted(0);
        problem.setCreatedAt(LocalDateTime.now());
        problem.setUpdatedAt(LocalDateTime.now());
        problem.setIsDeleted(false);

        Problem savedProblem = problemRepository.save(problem);
        log.info("Created problem: {} with slug: {}", savedProblem.getId(), savedProblem.getSlug());

        problemRedisService.evictProblemListCache();
        problemRedisService.evictTags();

        return buildProblemDetailResponse(savedProblem);
    }

    @Override
    @Transactional
    public ProblemDetailResponse updateProblem(UUID id, UpdateProblemRequest request) {
        Problem problem = getProblemEntity(id);
        User currentUser = getCurrentUser();
        validateManagePermission(problem, currentUser);

        String oldSlug = problem.getSlug();

        if (request.getTitle() != null && !request.getTitle().isBlank()
                && !request.getTitle().trim().equalsIgnoreCase(problem.getTitle())) {
            problem.setTitle(request.getTitle().trim());
            problem.setSlug(generateUniqueSlug(request.getTitle().trim(), problem.getId()));
        }

        problemMapper.updateProblemFromDto(request, problem);

        if (request.getTagNames() != null) {
            problem.setTags(resolveTags(request.getTagNames()));
        }

        problem.setUpdatedAt(LocalDateTime.now());
        Problem updatedProblem = problemRepository.save(problem);
        log.info("Updated problem: {}", updatedProblem.getId());

        // Invalidate cache
        problemRedisService.evictProblemDetail(updatedProblem.getId(), updatedProblem.getSlug());
        if (!oldSlug.equals(updatedProblem.getSlug())) {
            problemRedisService.evictProblemDetail(null, oldSlug);
        }
        problemRedisService.evictProblemListCache();

        return buildProblemDetailResponse(updatedProblem);
    }

    @Override
    @Transactional(readOnly = true)
    public ProblemDetailResponse getProblemById(UUID id) {
        Optional<User> currentUserOpt = getCurrentUserOptional();

        // 1. Try reading from Redis cache first
        Optional<ProblemDetailResponse> cached = problemRedisService.getProblemDetailById(id);
        if (cached.isPresent()) {
            ProblemDetailResponse detail = cached.get();
            if (canViewProblemStatus(detail.getStatus(), currentUserOpt)) {
                // Enrich real-time acceptance rate from Redis stats counter
                problemRedisService.getProblemStats(id).ifPresent(stats -> detail.setAcceptanceRate(stats.getAcceptanceRate()));
                return detail;
            }
        }

        // 2. Cache miss -> query DB
        Problem problem = getProblemEntity(id);

        if (!canViewProblem(problem, currentUserOpt)) {
            throw new AppException(ErrorCode.PROBLEM_NOT_FOUND);
        }

        ProblemDetailResponse response = buildProblemDetailResponse(problem);

        // 3. Cache published problem detail and stats
        if (problem.getStatus() == Problem.ProblemStatus.PUBLISHED) {
            problemRedisService.saveProblemDetail(response);
            problemRedisService.saveProblemStats(problem.getId(), problem.getTotalSubmissions(), problem.getTotalAccepted(), response.getAcceptanceRate());
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public ProblemDetailResponse getProblemBySlug(String slug) {
        Optional<User> currentUserOpt = getCurrentUserOptional();

        // 1. Try reading from Redis cache first
        Optional<ProblemDetailResponse> cached = problemRedisService.getProblemDetailBySlug(slug);
        if (cached.isPresent()) {
            ProblemDetailResponse detail = cached.get();
            if (canViewProblemStatus(detail.getStatus(), currentUserOpt)) {
                // Enrich real-time acceptance rate from Redis stats counter
                problemRedisService.getProblemStats(detail.getId()).ifPresent(stats -> detail.setAcceptanceRate(stats.getAcceptanceRate()));
                return detail;
            }
        }

        // 2. Cache miss -> query DB
        Problem problem = problemRepository.findBySlugAndIsDeletedFalse(slug)
                .orElseThrow(() -> new AppException(ErrorCode.PROBLEM_NOT_FOUND));

        if (!canViewProblem(problem, currentUserOpt)) {
            throw new AppException(ErrorCode.PROBLEM_NOT_FOUND);
        }

        ProblemDetailResponse response = buildProblemDetailResponse(problem);

        // 3. Cache published problem detail and stats
        if (problem.getStatus() == Problem.ProblemStatus.PUBLISHED) {
            problemRedisService.saveProblemDetail(response);
            problemRedisService.saveProblemStats(problem.getId(), problem.getTotalSubmissions(), problem.getTotalAccepted(), response.getAcceptanceRate());
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProblemSummaryResponse> getProblems(ProblemFilterRequest filterRequest, Pageable pageable) {
        Optional<User> currentUserOpt = getCurrentUserOptional();

        Problem.ProblemStatus effectiveStatus = null;
        boolean canViewAllStatuses = currentUserOpt.isPresent() && (
                currentUserOpt.get().getRole() == User.Role.ADMIN ||
                currentUserOpt.get().getRole() == User.Role.PROBLEM_SETTER
        );

        if (!canViewAllStatuses) {
            // Normal / unauthenticated users can only see PUBLISHED problems
            effectiveStatus = Problem.ProblemStatus.PUBLISHED;
        } else if (filterRequest != null && filterRequest.getStatus() != null) {
            effectiveStatus = filterRequest.getStatus();
        }

        boolean isAuthenticated = currentUserOpt.isPresent();
        boolean isPublicQuery = !canViewAllStatuses && (filterRequest == null || filterRequest.getSolved() == null);
        String cacheKey = isPublicQuery ? problemRedisService.generateListCacheKey(filterRequest, pageable) : null;

        // Try reading public published problem list from Redis
        if (isPublicQuery) {
            Optional<PageResponse<ProblemSummaryResponse>> cachedList = problemRedisService.getProblemList(cacheKey);
            if (cachedList.isPresent()) {
                PageResponse<ProblemSummaryResponse> pr = cachedList.get();
                List<ProblemSummaryResponse> content = pr.getContent() != null ? pr.getContent() : Collections.emptyList();
                return new org.springframework.data.domain.PageImpl<>(content, pageable, pr.getTotalElements());
            }
        }

        Specification<Problem> specification = ProblemSpecification.filter(filterRequest, effectiveStatus);
        Page<Problem> problemPage = problemRepository.findAll(specification, pageable);

        Page<ProblemSummaryResponse> summaryPage = problemPage.map(problem -> {
            ProblemSummaryResponse summary = problemMapper.toProblemSummaryResponse(problem);
            if (isAuthenticated) {
                summary.setSolvedByCurrentUser(false);
            } else {
                summary.setSolvedByCurrentUser(null);
            }
            return summary;
        });

        // Save public query to Redis cache
        if (isPublicQuery && cacheKey != null) {
            problemRedisService.saveProblemList(cacheKey, PageResponse.from(summaryPage));
        }

        return summaryPage;
    }

    @Override
    @Transactional
    public void deleteProblem(UUID id) {
        Problem problem = getProblemEntity(id);
        User currentUser = getCurrentUser();
        validateManagePermission(problem, currentUser);

        problem.setIsDeleted(true);
        problem.setUpdatedAt(LocalDateTime.now());
        problemRepository.save(problem);

        log.info("Soft deleted problem: {}", id);

        problemRedisService.evictProblemDetail(problem.getId(), problem.getSlug());
        problemRedisService.evictProblemListCache();
    }

    @Override
    @Transactional
    public ProblemDetailResponse updateProblemStatus(UUID id, Problem.ProblemStatus status) {
        Problem problem = getProblemEntity(id);
        User currentUser = getCurrentUser();
        validateManagePermission(problem, currentUser);

        problem.setStatus(status);
        problem.setUpdatedAt(LocalDateTime.now());
        Problem savedProblem = problemRepository.save(problem);

        log.info("Updated problem {} status to {}", id, status);

        problemRedisService.evictProblemDetail(savedProblem.getId(), savedProblem.getSlug());
        problemRedisService.evictProblemListCache();

        return buildProblemDetailResponse(savedProblem);
    }

    @Override
    @Transactional(readOnly = true)
    public ProblemStatResponse getProblemStats(UUID id) {
        // 1. Try reading from Redis Hash stats
        Optional<ProblemStatResponse> cachedStats = problemRedisService.getProblemStats(id);
        if (cachedStats.isPresent()) {
            return cachedStats.get();
        }

        // 2. Cache miss -> query DB entity
        Problem problem = getProblemEntity(id);
        Double acceptanceRate = problemMapper.calculateAcceptanceRate(problem);

        ProblemStatResponse response = ProblemStatResponse.builder()
                .problemId(problem.getId())
                .totalSubmissions(problem.getTotalSubmissions())
                .totalAccepted(problem.getTotalAccepted())
                .acceptanceRate(acceptanceRate)
                .submissionsByLanguage(new HashMap<>())
                .build();

        // 3. Save to Redis
        problemRedisService.saveProblemStats(problem.getId(), problem.getTotalSubmissions(), problem.getTotalAccepted(), acceptanceRate);

        return response;
    }

    private Problem getProblemEntity(UUID id) {
        return problemRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.PROBLEM_NOT_FOUND));
    }

    private ProblemDetailResponse buildProblemDetailResponse(Problem problem) {
        ProblemDetailResponse response = problemMapper.toProblemDetailResponse(problem);
        List<TestCase> sampleTestCases = testCaseRepository.findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(problem.getId());
        response.setSampleTestCases(testCaseMapper.toTestCaseResponseList(sampleTestCases));
        return response;
    }

    private Set<Tag> resolveTags(List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) {
            return new HashSet<>();
        }

        Set<Tag> tags = new HashSet<>();
        for (String tagName : tagNames) {
            if (tagName == null || tagName.isBlank()) {
                continue;
            }
            String trimmedName = tagName.trim();
            Tag tag = tagRepository.findByNameIgnoreCase(trimmedName)
                    .orElseGet(() -> tagRepository.save(Tag.builder().name(trimmedName).build()));
            tags.add(tag);
        }
        return tags;
    }

    private String generateUniqueSlug(String title, UUID problemIdToExclude) {
        String baseSlug = SlugUtils.toSlug(title);
        if (baseSlug.isBlank()) {
            baseSlug = "problem-" + System.currentTimeMillis();
        }

        String slug = baseSlug;
        int counter = 1;

        while (true) {
            boolean exists;
            if (problemIdToExclude != null) {
                exists = problemRepository.existsBySlugAndIdNot(slug, problemIdToExclude);
            } else {
                exists = problemRepository.existsBySlug(slug);
            }

            if (!exists) {
                return slug;
            }

            slug = baseSlug + "-" + counter;
            counter++;
        }
    }

    private void validateManagePermission(Problem problem, User user) {
        boolean isAdmin = user.getRole() == User.Role.ADMIN;
        boolean isOwner = problem.getCreatedBy() != null && problem.getCreatedBy().getId().equals(user.getId());

        if (!isAdmin && !isOwner) {
            throw new AppException(ErrorCode.UNAUTHORIZED_OPERATION);
        }
    }

    private boolean canViewProblemStatus(Problem.ProblemStatus status, Optional<User> currentUserOpt) {
        if (status == Problem.ProblemStatus.PUBLISHED) {
            return true;
        }

        if (currentUserOpt.isEmpty()) {
            return false;
        }

        User user = currentUserOpt.get();
        return user.getRole() == User.Role.ADMIN || user.getRole() == User.Role.PROBLEM_SETTER;
    }

    private boolean canViewProblem(Problem problem, Optional<User> currentUserOpt) {
        if (problem.getStatus() == Problem.ProblemStatus.PUBLISHED) {
            return true;
        }

        if (currentUserOpt.isEmpty()) {
            return false;
        }

        User user = currentUserOpt.get();
        if (user.getRole() == User.Role.ADMIN || user.getRole() == User.Role.PROBLEM_SETTER) {
            return true;
        }

        return problem.getCreatedBy() != null && problem.getCreatedBy().getId().equals(user.getId());
    }

    private User getCurrentUser() {
        return getCurrentUserOptional()
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
    }

    private Optional<User> getCurrentUserOptional() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return Optional.empty();
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email);
    }
}
