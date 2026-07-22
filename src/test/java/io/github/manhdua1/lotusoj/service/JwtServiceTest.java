package io.github.manhdua1.lotusoj.service;

import io.github.manhdua1.lotusoj.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    @InjectMocks
    private JwtService jwtService;

    // HS512 requires a secret key of at least 512 bits (64 bytes)
    private static final String SECRET_KEY = "1234567890123456789012345678901234567890123456789012345678901234";
    private static final long DURATION_SECONDS = 3600L;

    private User sampleUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jwtService, "signerKey", SECRET_KEY);
        ReflectionTestUtils.setField(jwtService, "accessTokenDuration", DURATION_SECONDS);

        userId = UUID.randomUUID();
        sampleUser = User.builder()
                .id(userId)
                .email("test@example.com")
                .username("testuser")
                .role(User.Role.USER)
                .build();
    }

    @Test
    @DisplayName("generateAccessToken should return a non-null token when user is valid")
    void generateAccessToken_success() {
        String token = jwtService.generateAccessToken(sampleUser);

        assertNotNull(token);
        assertFalse(token.trim().isEmpty());
    }

    @Test
    @DisplayName("parseClaims should correctly extract subject, userId, and role from token")
    void parseClaims_success() {
        String token = jwtService.generateAccessToken(sampleUser);

        Claims claims = jwtService.parseClaims(token);

        assertNotNull(claims);
        assertEquals(sampleUser.getEmail(), claims.getSubject());
        assertEquals(userId.toString(), claims.get("userId"));
        assertEquals(User.Role.USER.name(), claims.get("role"));
        assertNotNull(claims.getExpiration());
    }

    @Test
    @DisplayName("isValid should return true for a valid token")
    void isValid_validToken_returnsTrue() {
        String token = jwtService.generateAccessToken(sampleUser);

        boolean valid = jwtService.isValid(token);

        assertTrue(valid);
    }

    @Test
    @DisplayName("isValid should return false for a malformed token")
    void isValid_malformedToken_returnsFalse() {
        String invalidToken = "invalid.token.string";

        boolean valid = jwtService.isValid(invalidToken);

        assertFalse(valid);
    }

    @Test
    @DisplayName("isValid should return false for an expired token")
    void isValid_expiredToken_returnsFalse() {
        // Set duration to negative to create an expired token
        ReflectionTestUtils.setField(jwtService, "accessTokenDuration", -3600L);
        String expiredToken = jwtService.generateAccessToken(sampleUser);

        boolean valid = jwtService.isValid(expiredToken);

        assertFalse(valid);
    }

    @Test
    @DisplayName("isValid should return false for a token signed with a different key")
    void isValid_tamperedKey_returnsFalse() {
        String token = jwtService.generateAccessToken(sampleUser);

        // Change signerKey to a different secret
        String differentSecretKey = "9876543210987654321098765432109876543210987654321098765432109876";
        ReflectionTestUtils.setField(jwtService, "signerKey", differentSecretKey);

        boolean valid = jwtService.isValid(token);

        assertFalse(valid);
    }

    @Test
    @DisplayName("parseClaims should throw JwtException for an invalid token")
    void parseClaims_invalidToken_throwsException() {
        String invalidToken = "invalid.token.string";

        assertThrows(JwtException.class, () -> jwtService.parseClaims(invalidToken));
    }
}
