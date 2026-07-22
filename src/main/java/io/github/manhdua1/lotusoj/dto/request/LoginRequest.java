package io.github.manhdua1.lotusoj.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoginRequest {

    @NotBlank(message = "EMAIL_REQUIRED")
    String email;

    @NotBlank(message = "PASSWORD_REQUIRED")
    String password;
}
