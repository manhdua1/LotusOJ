package io.github.manhdua1.lotusoj.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RegisterRequest {

    @NotBlank(message = "USERNAME_REQUIRED")
    @Size(min = 3, max = 30, message = "INVALID_USERNAME")
    String username;

    @NotBlank(message = "EMAIL_REQUIRED")
    @Email(message = "INVALID_EMAIL")
    String email;

    @NotBlank(message = "PASSWORD_REQUIRED")
    @Size(min = 6, message = "INVALID_PASSWORD")
    String password;

    String avatarUrl;
}
