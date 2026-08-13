package io.github.manhdua1.lotusoj.service.auth.impl;

import io.github.manhdua1.lotusoj.dto.request.auth.LoginRequest;
import io.github.manhdua1.lotusoj.dto.request.auth.RegisterRequest;
import io.github.manhdua1.lotusoj.dto.response.auth.LoginResult;
import io.github.manhdua1.lotusoj.dto.response.auth.UserResponse;
import io.github.manhdua1.lotusoj.entity.auth.User;
import io.github.manhdua1.lotusoj.exception.AppException;
import io.github.manhdua1.lotusoj.exception.ErrorCode;
import io.github.manhdua1.lotusoj.mapper.UserMapper;
import io.github.manhdua1.lotusoj.repository.auth.UserRepository;
import io.github.manhdua1.lotusoj.service.auth.AuthService;
import io.jsonwebtoken.Claims;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthServiceImpl implements AuthService {
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    UserMapper userMapper;
    JwtServiceImpl jwtService;
    RefreshTokenServiceImpl refreshTokenService;
    TokenBlacklistServiceImpl tokenBlacklistService;

    @Override
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USERNAME_EXISTED);
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .avatarUrl(request.getAvatarUrl())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        userRepository.save(user);

        return userMapper.toUserResponse(user);
    }

    @Override
    public LoginResult login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = refreshTokenService.generate(user);

        return new LoginResult(accessToken, refreshToken);
    }

    @Override
    public String refresh(String refreshTokenRaw) {
        User user = refreshTokenService.validateAndGetUser(refreshTokenRaw);

        return jwtService.generateAccessToken(user);
    }

    @Override
    @Transactional
    public void logout(String accessToken, String refreshTokenRaw) {
        Claims claims = jwtService.parseClaims(accessToken);
        tokenBlacklistService.blacklist(claims.getId(), claims.getExpiration());

        refreshTokenService.revoke(refreshTokenRaw);
    }
}
