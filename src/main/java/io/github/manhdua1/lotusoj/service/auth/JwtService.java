package io.github.manhdua1.lotusoj.service.auth;

import io.github.manhdua1.lotusoj.entity.auth.User;
import io.jsonwebtoken.Claims;

public interface JwtService {

    String generateAccessToken(User user);

    Claims parseClaims(String token);

    boolean isValid(String token);
}
