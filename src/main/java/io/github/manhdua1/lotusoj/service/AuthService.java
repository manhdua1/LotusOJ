package io.github.manhdua1.lotusoj.service;

import io.github.manhdua1.lotusoj.dto.request.LoginRequest;
import io.github.manhdua1.lotusoj.dto.request.RegisterRequest;
import io.github.manhdua1.lotusoj.dto.response.UserResponse;
import io.github.manhdua1.lotusoj.entity.User;
import io.github.manhdua1.lotusoj.exception.AppException;
import io.github.manhdua1.lotusoj.exception.ErrorCode;
import io.github.manhdua1.lotusoj.mapper.UserMapper;
import io.github.manhdua1.lotusoj.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthService {
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    UserMapper userMapper;
    JwtService jwtService;

    public UserResponse register(RegisterRequest request) {
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

    public String login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        return jwtService.generateAccessToken(user);
    }
}
