package io.github.manhdua1.lotusoj.controller;

import io.github.manhdua1.lotusoj.dto.request.LoginRequest;
import io.github.manhdua1.lotusoj.dto.request.RegisterRequest;
import io.github.manhdua1.lotusoj.dto.response.ApiResponse;
import io.github.manhdua1.lotusoj.dto.response.UserResponse;
import io.github.manhdua1.lotusoj.service.AuthService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthController {
    AuthService authService;

    @PostMapping("/register")
    public ApiResponse<UserResponse> register(@RequestBody @Valid RegisterRequest request) {
        return ApiResponse.success(authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<String> login(@RequestBody @Valid LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }
}
