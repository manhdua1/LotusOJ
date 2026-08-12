package io.github.manhdua1.lotusoj.service;

import io.github.manhdua1.lotusoj.entity.User;

import java.util.UUID;

public interface RefreshTokenService {

    String generate(User user);

    User validateAndGetUser(String rawToken);

    void revokeAllForUser(UUID userId);

    void revoke(String refreshTokenRaw);

}
