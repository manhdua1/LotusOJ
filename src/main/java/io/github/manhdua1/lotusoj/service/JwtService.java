package io.github.manhdua1.lotusoj.service;

import io.github.manhdua1.lotusoj.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
public class JwtService {
    @Value("${jwt.signer-key}")
    String signerKey;

    @Value("${jwt.access-token-duration}")
    long accessTokenDuration;

    public String generateAccessToken(User user) {
        SecretKey key = Keys.hmacShaKeyFor(signerKey.getBytes(StandardCharsets.UTF_8));

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenDuration * 1000))
                .signWith(key, Jwts.SIG.HS512)
                .compact();
    }
}
