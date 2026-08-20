package io.github.manhdua1.lotusoj.service.auth.impl;

import io.github.manhdua1.lotusoj.service.auth.TokenBlacklistService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TokenBlacklistServiceImpl implements TokenBlacklistService {
    final StringRedisTemplate redisTemplate;
    static final String PREFIX = "blacklist:";

    @Override
    public void blacklist(String jti, Date expiration) {
        long ttlSeconds = (expiration.getTime() - System.currentTimeMillis()) / 1000;
        if (ttlSeconds > 0) {
            redisTemplate.opsForValue().set(PREFIX + jti, "1", ttlSeconds, TimeUnit.SECONDS);
        }
    }

    @Override
    public boolean isBlacklisted(String jti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(PREFIX + jti));
    }
}
