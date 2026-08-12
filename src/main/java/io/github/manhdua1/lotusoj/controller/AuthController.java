package io.github.manhdua1.lotusoj.controller;

import io.github.manhdua1.lotusoj.dto.request.LoginRequest;
import io.github.manhdua1.lotusoj.dto.request.RegisterRequest;
import io.github.manhdua1.lotusoj.dto.response.ApiResponse;
import io.github.manhdua1.lotusoj.dto.response.LoginResult;
import io.github.manhdua1.lotusoj.dto.response.UserResponse;
import io.github.manhdua1.lotusoj.service.impl.AuthServiceImpl;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthController {
    final AuthServiceImpl authService;

    @Value("${jwt.refresh-token-duration}")
    long refreshTokenDuration;

    @PostMapping("/register")
    public ApiResponse<UserResponse> register(@RequestBody @Valid RegisterRequest request) {

        return ApiResponse.success(authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<String> login(@RequestBody @Valid LoginRequest request, HttpServletResponse response) {
        LoginResult result = authService.login(request);

        ResponseCookie cookie = ResponseCookie.from("refreshToken", result.refreshToken())
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(refreshTokenDuration)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ApiResponse.success(result.accessToken());
    }

    @PostMapping("/refresh")
    public ApiResponse<String> refresh(@CookieValue("refreshToken") String refreshToken) {
        String newAccessToken = authService.refresh(refreshToken);
        return ApiResponse.success(newAccessToken);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            @RequestHeader("Authorization") String authHeader,
            @CookieValue(value = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response) {

        String accessToken = authHeader.substring(7);
        authService.logout(accessToken, refreshToken);

        ResponseCookie clearCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true).secure(true).sameSite("Strict").path("/api/auth").maxAge(0).build();
        response.addHeader(HttpHeaders.SET_COOKIE, clearCookie.toString());

        return ApiResponse.success(null);
    }
}
