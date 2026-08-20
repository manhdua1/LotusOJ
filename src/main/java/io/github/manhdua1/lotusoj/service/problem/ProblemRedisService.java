package io.github.manhdua1.lotusoj.service.problem;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.manhdua1.lotusoj.dto.request.problem.ProblemFilterRequest;
import io.github.manhdua1.lotusoj.dto.response.PageResponse;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemDetailResponse;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemStatResponse;
import io.github.manhdua1.lotusoj.dto.response.problem.ProblemSummaryResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProblemRedisService {

    StringRedisTemplate redisTemplate;
    ObjectMapper objectMapper;

    static final String KEY_DETAIL_SLUG = "problem:detail:slug:";
    static final String KEY_DETAIL_ID = "problem:detail:id:";
    static final String KEY_STATS = "problem:stats:";
    static final String KEY_LIST_PREFIX = "problem:list:";
    static final String KEY_TAGS = "problem:tags:all";

    static final Duration DETAIL_BASE_TTL = Duration.ofHours(24);
    static final Duration LIST_BASE_TTL = Duration.ofMinutes(5);
    static final Duration STATS_BASE_TTL = Duration.ofDays(30);
    static final Duration TAGS_BASE_TTL = Duration.ofDays(7);

    // =========================================================================
    // 1. Problem Detail Cache (Static Content & Metadata)
    // =========================================================================

    public Optional<ProblemDetailResponse> getProblemDetailBySlug(String slug) {
        return getObject(KEY_DETAIL_SLUG + slug, ProblemDetailResponse.class);
    }

    public Optional<ProblemDetailResponse> getProblemDetailById(UUID id) {
        return getObject(KEY_DETAIL_ID + id.toString(), ProblemDetailResponse.class);
    }

    public void saveProblemDetail(ProblemDetailResponse problem) {
        if (problem == null) return;
        Duration ttlWithJitter = addJitter(DETAIL_BASE_TTL, 300);

        setObject(KEY_DETAIL_SLUG + problem.getSlug(), problem, ttlWithJitter);
        if (problem.getId() != null) {
            setObject(KEY_DETAIL_ID + problem.getId().toString(), problem, ttlWithJitter);
        }
    }

    public void evictProblemDetail(UUID id, String slug) {
        try {
            List<String> keysToDelete = new ArrayList<>();
            if (id != null) {
                keysToDelete.add(KEY_DETAIL_ID + id.toString());
            }
            if (slug != null && !slug.isBlank()) {
                keysToDelete.add(KEY_DETAIL_SLUG + slug);
            }
            if (!keysToDelete.isEmpty()) {
                redisTemplate.delete(keysToDelete);
            }
            // Clear list cache as well when a problem is modified
            evictProblemListCache();
        } catch (Exception e) {
            log.warn("Failed to evict problem detail cache: id={}, slug={}", id, slug, e);
        }
    }

    // =========================================================================
    // 2. Problem Stats Cache (Dynamic Real-time Counters using Redis Hash)
    // =========================================================================

    public Optional<ProblemStatResponse> getProblemStats(UUID id) {
        try {
            String key = KEY_STATS + id.toString();
            Map<Object, Object> entries = redisTemplate.opsForHash().entries(key);
            if (entries.isEmpty()) {
                return Optional.empty();
            }

            int submissions = parseInt(entries.get("totalSubmissions"), 0);
            int accepted = parseInt(entries.get("totalAccepted"), 0);
            double acceptanceRate = calculateRate(totalSubmissions(submissions), accepted);

            return Optional.of(ProblemStatResponse.builder()
                    .problemId(id)
                    .totalSubmissions(submissions)
                    .totalAccepted(accepted)
                    .acceptanceRate(acceptanceRate)
                    .submissionsByLanguage(new HashMap<>())
                    .build());
        } catch (Exception e) {
            log.warn("Failed to get problem stats from Redis for id={}", id, e);
            return Optional.empty();
        }
    }

    public void saveProblemStats(UUID id, int totalSubmissions, int totalAccepted, Double acceptanceRate) {
        try {
            String key = KEY_STATS + id.toString();
            Map<String, String> map = new HashMap<>();
            map.put("totalSubmissions", String.valueOf(totalSubmissions));
            map.put("totalAccepted", String.valueOf(totalAccepted));
            if (acceptanceRate != null) {
                map.put("acceptanceRate", String.format(Locale.US, "%.2f", acceptanceRate));
            }

            redisTemplate.opsForHash().putAll(key, map);
            redisTemplate.expire(key, STATS_BASE_TTL);
        } catch (Exception e) {
            log.warn("Failed to save problem stats to Redis for id={}", id, e);
        }
    }

    public void incrementSubmissions(UUID id, int count) {
        try {
            String key = KEY_STATS + id.toString();
            redisTemplate.opsForHash().increment(key, "totalSubmissions", count);
            redisTemplate.expire(key, STATS_BASE_TTL);
        } catch (Exception e) {
            log.warn("Failed to increment submissions in Redis for id={}", id, e);
        }
    }

    public void incrementAccepted(UUID id, int count) {
        try {
            String key = KEY_STATS + id.toString();
            redisTemplate.opsForHash().increment(key, "totalAccepted", count);
            redisTemplate.expire(key, STATS_BASE_TTL);
        } catch (Exception e) {
            log.warn("Failed to increment accepted in Redis for id={}", id, e);
        }
    }

    // =========================================================================
    // 3. Problem List & Pagination Cache
    // =========================================================================

    public Optional<PageResponse<ProblemSummaryResponse>> getProblemList(String cacheKey) {
        try {
            String json = redisTemplate.opsForValue().get(KEY_LIST_PREFIX + cacheKey);
            if (json == null || json.isBlank()) {
                return Optional.empty();
            }
            PageResponse<ProblemSummaryResponse> page = objectMapper.readValue(
                    json,
                    new TypeReference<PageResponse<ProblemSummaryResponse>>() {}
            );
            return Optional.ofNullable(page);
        } catch (Exception e) {
            log.warn("Failed to get problem list from Redis: key={}", cacheKey, e);
            return Optional.empty();
        }
    }

    public void saveProblemList(String cacheKey, PageResponse<ProblemSummaryResponse> pageResponse) {
        try {
            String json = objectMapper.writeValueAsString(pageResponse);
            Duration ttl = addJitter(LIST_BASE_TTL, 60);
            redisTemplate.opsForValue().set(KEY_LIST_PREFIX + cacheKey, json, ttl);
        } catch (Exception e) {
            log.warn("Failed to save problem list to Redis: key={}", cacheKey, e);
        }
    }

    public void evictProblemListCache() {
        try {
            Set<String> keys = redisTemplate.keys(KEY_LIST_PREFIX + "*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception e) {
            log.warn("Failed to evict problem list cache", e);
        }
    }

    public String generateListCacheKey(ProblemFilterRequest filter, Pageable pageable) {
        StringBuilder sb = new StringBuilder();
        sb.append("p").append(pageable.getPageNumber())
          .append(":s").append(pageable.getPageSize())
          .append(":sort").append(pageable.getSort().toString().replace(" ", ""));

        if (filter != null) {
            if (filter.getDifficulty() != null) {
                sb.append(":diff").append(filter.getDifficulty().name());
            }
            if (filter.getTag() != null && !filter.getTag().isBlank()) {
                sb.append(":tag").append(filter.getTag().trim().toLowerCase());
            }
            if (filter.getKeyword() != null && !filter.getKeyword().isBlank()) {
                sb.append(":kw").append(filter.getKeyword().trim().toLowerCase());
            }
        }
        return sb.toString();
    }

    // =========================================================================
    // 4. Tags Cache
    // =========================================================================

    public Optional<List<String>> getAllTagNames() {
        try {
            String json = redisTemplate.opsForValue().get(KEY_TAGS);
            if (json == null || json.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(objectMapper.readValue(json, new TypeReference<List<String>>() {}));
        } catch (Exception e) {
            log.warn("Failed to get tags from Redis", e);
            return Optional.empty();
        }
    }

    public void saveAllTagNames(List<String> tags) {
        try {
            String json = objectMapper.writeValueAsString(tags);
            redisTemplate.opsForValue().set(KEY_TAGS, json, TAGS_BASE_TTL);
        } catch (Exception e) {
            log.warn("Failed to save tags to Redis", e);
        }
    }

    public void evictTags() {
        try {
            redisTemplate.delete(KEY_TAGS);
        } catch (Exception e) {
            log.warn("Failed to evict tags from Redis", e);
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

    private int parseInt(Object obj, int defaultValue) {
        if (obj == null) return defaultValue;
        try {
            return Integer.parseInt(obj.toString());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    private int totalSubmissions(int submissions) {
        return Math.max(0, submissions);
    }

    private double calculateRate(int totalSubmissions, int totalAccepted) {
        if (totalSubmissions <= 0) return 0.0;
        double rate = ((double) totalAccepted / totalSubmissions) * 100.0;
        return Math.round(rate * 10.0) / 10.0;
    }
}
