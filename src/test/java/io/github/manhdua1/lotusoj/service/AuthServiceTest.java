package io.github.manhdua1.lotusoj.service;

import io.github.manhdua1.lotusoj.dto.request.LoginRequest;
import io.github.manhdua1.lotusoj.dto.request.RegisterRequest;
import io.github.manhdua1.lotusoj.dto.response.UserResponse;
import io.github.manhdua1.lotusoj.entity.User;
import io.github.manhdua1.lotusoj.exception.AppException;
import io.github.manhdua1.lotusoj.exception.ErrorCode;
import io.github.manhdua1.lotusoj.mapper.UserMapper;
import io.github.manhdua1.lotusoj.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private LoginRequest loginRequest;
    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .username("testuser")
                .passwordHash("hashed_password")
                .role(User.Role.USER)
                .build();

        loginRequest = LoginRequest.builder()
                .email("test@example.com")
                .password("password123")
                .build();

        registerRequest = RegisterRequest.builder()
                .email("new@example.com")
                .username("newuser")
                .password("password123")
                .avatarUrl("https://example.com/avatar.png")
                .build();
    }

    @Nested
    @DisplayName("login tests")
    class LoginTests {

        @Test
        @DisplayName("Should successfully login and return JWT token when credentials are valid")
        void login_success() {
            // Given
            when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches(loginRequest.getPassword(), sampleUser.getPasswordHash())).thenReturn(true);
            when(jwtService.generateAccessToken(sampleUser)).thenReturn("mocked.jwt.token");

            // When
            String token = authService.login(loginRequest);

            // Then
            assertNotNull(token);
            assertEquals("mocked.jwt.token", token);
            verify(userRepository, times(1)).findByEmail(loginRequest.getEmail());
            verify(passwordEncoder, times(1)).matches(loginRequest.getPassword(), sampleUser.getPasswordHash());
            verify(jwtService, times(1)).generateAccessToken(sampleUser);
        }

        @Test
        @DisplayName("Should throw USER_NOT_EXISTED exception when email is not found")
        void login_userNotFound_throwsException() {
            // Given
            when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> authService.login(loginRequest));

            assertEquals(ErrorCode.USER_NOT_EXISTED, exception.getErrorCode());
            verify(userRepository, times(1)).findByEmail(loginRequest.getEmail());
            verifyNoInteractions(passwordEncoder);
            verifyNoInteractions(jwtService);
        }

        @Test
        @DisplayName("Should throw INVALID_CREDENTIALS exception when password does not match")
        void login_invalidPassword_throwsException() {
            // Given
            when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches(loginRequest.getPassword(), sampleUser.getPasswordHash())).thenReturn(false);

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> authService.login(loginRequest));

            assertEquals(ErrorCode.INVALID_CREDENTIALS, exception.getErrorCode());
            verify(userRepository, times(1)).findByEmail(loginRequest.getEmail());
            verify(passwordEncoder, times(1)).matches(loginRequest.getPassword(), sampleUser.getPasswordHash());
            verifyNoInteractions(jwtService);
        }
    }

    @Nested
    @DisplayName("register tests")
    class RegisterTests {

        @Test
        @DisplayName("Should successfully register a new user")
        void register_success() {
            // Given
            UserResponse expectedResponse = UserResponse.builder()
                    .id(UUID.randomUUID())
                    .email(registerRequest.getEmail())
                    .username(registerRequest.getUsername())
                    .avatarUrl(registerRequest.getAvatarUrl())
                    .build();

            when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
            when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("hashed_password");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(userMapper.toUserResponse(any(User.class))).thenReturn(expectedResponse);

            // When
            UserResponse response = authService.register(registerRequest);

            // Then
            assertNotNull(response);
            assertEquals(registerRequest.getEmail(), response.getEmail());
            verify(userRepository, times(1)).existsByEmail(registerRequest.getEmail());
            verify(passwordEncoder, times(1)).encode(registerRequest.getPassword());
            verify(userRepository, times(1)).save(any(User.class));
            verify(userMapper, times(1)).toUserResponse(any(User.class));
        }

        @Test
        @DisplayName("Should throw USER_EXISTED exception when email already exists")
        void register_emailExists_throwsException() {
            // Given
            when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(true);

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> authService.register(registerRequest));

            assertEquals(ErrorCode.USER_EXISTED, exception.getErrorCode());
            verify(userRepository, times(1)).existsByEmail(registerRequest.getEmail());
            verify(userRepository, never()).save(any(User.class));
        }
    }
}
