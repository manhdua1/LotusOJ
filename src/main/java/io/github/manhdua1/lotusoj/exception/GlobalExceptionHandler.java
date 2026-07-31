package io.github.manhdua1.lotusoj.exception;

import io.github.manhdua1.lotusoj.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.List;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(value = Exception.class)
    public ResponseEntity<ApiResponse<Void>> handlingException(Exception exception) {
        ApiResponse<Void> apiResponse = ApiResponse.error(ErrorCode.UNCATEGORIZED_EXCEPTION, exception.getMessage());
        return ResponseEntity.status(ErrorCode.UNCATEGORIZED_EXCEPTION.getHttpStatusCode())
                .body(apiResponse);
    }

    @ExceptionHandler(value = AppException.class)
    public ResponseEntity<ApiResponse<Void>> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        ApiResponse<Void> apiResponse = ApiResponse.error(errorCode);
        return ResponseEntity.status(errorCode.getHttpStatusCode())
                .body(apiResponse);
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handlingValidation(MethodArgumentNotValidException exception) {
        List<FieldError> fieldErrors = exception.getBindingResult().getFieldErrors();

        FieldError selectedError = fieldErrors.stream()
                .filter(error -> {
                    String msg = error.getDefaultMessage();
                    String code = error.getCode();
                    return (msg != null && msg.endsWith("_REQUIRED"))
                            || "NotBlank".equals(code)
                            || "NotNull".equals(code)
                            || "NotEmpty".equals(code);
                })
                .findFirst()
                .orElse(exception.getFieldError());

        String enumKey = selectedError != null ? selectedError.getDefaultMessage() : null;
        ErrorCode errorCode = ErrorCode.INVALID_KEY;

        if (enumKey != null) {
            try {
                errorCode = ErrorCode.valueOf(enumKey);
            } catch (IllegalArgumentException e) {
                // Keep INVALID_KEY
            }
        }

        ApiResponse<Void> apiResponse = ApiResponse.error(errorCode);
        return ResponseEntity.status(errorCode.getHttpStatusCode())
                .body(apiResponse);
    }
}
