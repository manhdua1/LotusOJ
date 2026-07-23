package io.github.manhdua1.lotusoj.repository;

import io.github.manhdua1.lotusoj.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

}
