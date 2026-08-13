package io.github.manhdua1.lotusoj.service.auth.impl;

import io.github.manhdua1.lotusoj.entity.auth.RefreshToken;
import io.github.manhdua1.lotusoj.entity.auth.User;
import io.github.manhdua1.lotusoj.exception.AppException;
import io.github.manhdua1.lotusoj.exception.ErrorCode;
import io.github.manhdua1.lotusoj.repository.auth.RefreshTokenRepository;
import io.github.manhdua1.lotusoj.repository.auth.UserRepository;
import io.github.manhdua1.lotusoj.service.auth.RefreshTokenService;
import jakarta.transaction.Transactional;
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
public class RefreshTokenServiceImpl implements RefreshTokenService {
    @Value("${jwt.refresh-token-duration}")
    long refreshTokenDuration;

    final RefreshTokenRepository refreshTokenRepository;
    final UserRepository userRepository;

    @Override
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

    @Override
    public User validateAndGetUser(String rawToken) {
        String hashedToken = hashToken(rawToken);
        RefreshToken entity = refreshTokenRepository.findByTokenHash(hashedToken)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REFRESH_TOKEN));

        if (entity.isRevoked() || entity.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        return userRepository.findById(entity.getUserId()).orElseThrow();
    }

    @Override
    public void revokeAllForUser(UUID userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    @Override
    @Transactional
    public void revoke(String refreshTokenRaw) {
        String hashedToken = hashToken(refreshTokenRaw);

        refreshTokenRepository.findByTokenHash(hashedToken)
                .ifPresent(token -> refreshTokenRepository.revokeById(token.getId()));
    }

    private String hashToken(String rawToken) {
        return DigestUtils.sha256Hex(rawToken);
    }
}
