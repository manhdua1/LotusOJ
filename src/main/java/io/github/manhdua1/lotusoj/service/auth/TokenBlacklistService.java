package io.github.manhdua1.lotusoj.service.auth;

import java.util.Date;

public interface TokenBlacklistService {

    void blacklist(String jti, Date expiration);

    boolean isBlacklisted(String jti);
}
