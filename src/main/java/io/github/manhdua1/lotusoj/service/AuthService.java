package io.github.manhdua1.lotusoj.service;

import io.github.manhdua1.lotusoj.dto.request.LoginRequest;
import io.github.manhdua1.lotusoj.dto.request.RegisterRequest;
import io.github.manhdua1.lotusoj.dto.response.LoginResult;
import io.github.manhdua1.lotusoj.dto.response.UserResponse;

public interface AuthService {

    UserResponse register(RegisterRequest request);

    LoginResult login(LoginRequest request);

    String refresh(String refreshTokenRaw);

    void logout(String accessToken, String refreshTokenRaw);
}
