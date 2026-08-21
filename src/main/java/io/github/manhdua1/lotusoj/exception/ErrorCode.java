package io.github.manhdua1.lotusoj.exception;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import lombok.Getter;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    INVALID_USERNAME(1003, "Invalid username", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Password must be at least 6 characters", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User not existed", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),
    USERNAME_REQUIRED(1008, "Username is required", HttpStatus.BAD_REQUEST),
    EMAIL_REQUIRED(1009, "Email is required", HttpStatus.BAD_REQUEST),
    INVALID_EMAIL(1010, "Invalid email format", HttpStatus.BAD_REQUEST),
    PASSWORD_REQUIRED(1011, "Password is required", HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS(1012, "Invalid email or password", HttpStatus.UNAUTHORIZED),
    INVALID_REFRESH_TOKEN(1013, "Invalid refresh token", HttpStatus.BAD_REQUEST),
    USERNAME_EXISTED(1014, "Username existed", HttpStatus.BAD_REQUEST),
    REFRESH_TOKEN_NOT_FOUND(1015, "Refresh token not found", HttpStatus.BAD_REQUEST),
    PROBLEM_NOT_FOUND(1016, "Problem not found", HttpStatus.NOT_FOUND),
    SLUG_EXISTED(1017, "Problem slug already exists", HttpStatus.BAD_REQUEST),
    TAG_NOT_FOUND(1018, "Tag not found", HttpStatus.NOT_FOUND),
    UNAUTHORIZED_OPERATION(1019, "You do not have permission to perform this operation", HttpStatus.FORBIDDEN),
    SUBMISSION_NOT_FOUND(1020, "Submission not found", HttpStatus.NOT_FOUND)
    ;

    int code;
    String message;
    HttpStatus httpStatusCode;

    ErrorCode(int code, String message, HttpStatus httpStatusCode) {
        this.code = code;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
    }
}
