package io.github.manhdua1.lotusoj.service;

import io.github.manhdua1.lotusoj.entity.RefreshToken;
import io.github.manhdua1.lotusoj.entity.User;
import io.github.manhdua1.lotusoj.exception.AppException;
import io.github.manhdua1.lotusoj.exception.ErrorCode;
import io.github.manhdua1.lotusoj.repository.RefreshTokenRepository;
import io.github.manhdua1.lotusoj.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RefreshTokenService {
    @Value("${jwt.refresh-token-duration}")
    long refreshTokenDuration;

    final RefreshTokenRepository refreshTokenRepository;
    final UserRepository userRepository;

    public String generate(User user) {
        String rawToken = UUID.randomUUID().toString() + UUID.randomUUID().toString();
        String hashedToken = hashToken(rawToken);

        RefreshToken entity = RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(hashedToken)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenDuration))
                .revoked(false)
                .build();
        refreshTokenRepository.save(entity);

        return rawToken;
    }

    public User validateAndGetUser(String rawToken) {
        String hashedToken = hashToken(rawToken);
        RefreshToken entity = refreshTokenRepository.findByTokenHash(hashedToken)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REFRESH_TOKEN));

        if (entity.isRevoked() || entity.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        return userRepository.findById(entity.getUserId()).orElseThrow();
    }

    public void revokeAllForUser(UUID userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    private String hashToken(String rawToken) {
        return DigestUtils.sha256Hex(rawToken);
    }
}
