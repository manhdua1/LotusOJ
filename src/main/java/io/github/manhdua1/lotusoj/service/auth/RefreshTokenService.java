package io.github.manhdua1.lotusoj.service.auth;

import io.github.manhdua1.lotusoj.entity.auth.User;

import java.util.UUID;

public interface RefreshTokenService {

    String generate(User user);

    User validateAndGetUser(String rawToken);

    void revokeAllForUser(UUID userId);

    void revoke(String refreshTokenRaw);

}
