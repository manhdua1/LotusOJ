package io.github.manhdua1.lotusoj.exception;

import io.github.manhdua1.lotusoj.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(value = Exception.class)
    public ResponseEntity<ApiResponse<Void>> handlingException(Exception exception) {
        ApiResponse<Void> apiResponse = ApiResponse.error(ErrorCode.UNCATEGORIZED_EXCEPTION);
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
}
