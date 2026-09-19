package io.github.manhdua1.lotusoj.service.submission;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.manhdua1.lotusoj.dto.response.PageResponse;
import io.github.manhdua1.lotusoj.dto.response.submission.SubmissionResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SubmissionRedisService {

    StringRedisTemplate redisTemplate;
    ObjectMapper objectMapper;

    static final String KEY_SUBMISSION_DETAIL = "submission:detail:";
    static final String KEY_RECENT_SUBMISSIONS = "submission:list:recent";

    static final Duration DETAIL_BASE_TTL = Duration.ofHours(24);
    static final Duration RECENT_BASE_TTL = Duration.ofSeconds(10);

    // =========================================================================
    // 1. Single Submission Detail Cache
    // =========================================================================

    public Optional<SubmissionResponse> getSubmission(UUID id) {
        if (id == null) return Optional.empty();
        return getObject(KEY_SUBMISSION_DETAIL + id, SubmissionResponse.class);
    }

    public void saveSubmission(SubmissionResponse submission) {
        if (submission == null || submission.getId() == null) return;
        Duration ttlWithJitter = addJitter(DETAIL_BASE_TTL, 300);
        setObject(KEY_SUBMISSION_DETAIL + submission.getId(), submission, ttlWithJitter);
    }

    public void evictSubmission(UUID id) {
        if (id == null) return;
        try {
            redisTemplate.delete(KEY_SUBMISSION_DETAIL + id);
        } catch (Exception e) {
            log.warn("Failed to evict submission cache for id={}", id, e);
        }
    }

    // =========================================================================
    // 2. Recent Submissions List Cache (Short TTL for Public Status Page)
    // =========================================================================

    public Optional<PageResponse<SubmissionResponse>> getRecentSubmissions() {
        try {
            String json = redisTemplate.opsForValue().get(KEY_RECENT_SUBMISSIONS);
            if (json == null || json.isBlank()) {
                return Optional.empty();
            }
            PageResponse<SubmissionResponse> page = objectMapper.readValue(
                    json,
                    new TypeReference<PageResponse<SubmissionResponse>>() {}
            );
            return Optional.ofNullable(page);
        } catch (Exception e) {
            log.warn("Failed to read recent submissions from Redis", e);
            return Optional.empty();
        }
    }

    public void saveRecentSubmissions(PageResponse<SubmissionResponse> page) {
        if (page == null) return;
        try {
            String json = objectMapper.writeValueAsString(page);
            redisTemplate.opsForValue().set(KEY_RECENT_SUBMISSIONS, json, RECENT_BASE_TTL);
        } catch (Exception e) {
            log.warn("Failed to save recent submissions to Redis", e);
        }
    }

    public void evictRecentSubmissions() {
        try {
            redisTemplate.delete(KEY_RECENT_SUBMISSIONS);
        } catch (Exception e) {
            log.warn("Failed to evict recent submissions from Redis", e);
        }
    }

    // =========================================================================
    // Internal Helper Methods
    // =========================================================================

    private <T> Optional<T> getObject(String key, Class<T> clazz) {
        try {
            String json = redisTemplate.opsForValue().get(key);
            if (json == null || json.isBlank()) {
                return Optional.empty();
            }
            return Optional.ofNullable(objectMapper.readValue(json, clazz));
        } catch (Exception e) {
            log.warn("Failed to read key {} from Redis", key, e);
            return Optional.empty();
        }
    }

    private void setObject(String key, Object value, Duration ttl) {
        try {
            String json = objectMapper.writeValueAsString(value);
            redisTemplate.opsForValue().set(key, json, ttl);
        } catch (Exception e) {
            log.warn("Failed to write key {} to Redis", key, e);
        }
    }

    private Duration addJitter(Duration baseTtl, int maxJitterSeconds) {
        long jitter = ThreadLocalRandom.current().nextInt(maxJitterSeconds + 1);
        return baseTtl.plusSeconds(jitter);
    }
}
