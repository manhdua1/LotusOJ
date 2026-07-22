package io.github.manhdua1.lotusoj.dto.response;

import io.github.manhdua1.lotusoj.entity.User.Role;
import io.github.manhdua1.lotusoj.entity.User.Status;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {

    UUID id;
    String email;
    String username;
    String avatarUrl;
    Role role;
    Status status;
    Integer totalSolved;
    Integer totalSubmissions;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
