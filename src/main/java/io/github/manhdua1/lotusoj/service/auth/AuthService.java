package io.github.manhdua1.lotusoj.service.auth;

import io.github.manhdua1.lotusoj.dto.request.auth.LoginRequest;
import io.github.manhdua1.lotusoj.dto.request.auth.RegisterRequest;
import io.github.manhdua1.lotusoj.dto.response.auth.LoginResult;
import io.github.manhdua1.lotusoj.dto.response.auth.UserResponse;

public interface AuthService {

    UserResponse register(RegisterRequest request);

    LoginResult login(LoginRequest request);

    String refresh(String refreshTokenRaw);

    void logout(String accessToken, String refreshTokenRaw);
}
