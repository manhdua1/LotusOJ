package io.github.manhdua1.lotusoj.exception;

import io.github.manhdua1.lotusoj.dto.response.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Objects;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("Should prioritize _REQUIRED error message when field has multiple validation errors")
    void handlingValidation_prioritizesRequiredError() throws NoSuchMethodException {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "target");
        
        // Add INVALID_USERNAME first, then USERNAME_REQUIRED
        bindingResult.addError(new FieldError("target", "username", null, false, new String[]{"Size"}, null, "INVALID_USERNAME"));
        bindingResult.addError(new FieldError("target", "username", null, false, new String[]{"NotBlank"}, null, "USERNAME_REQUIRED"));

        MethodParameter parameter = new MethodParameter(
                this.getClass().getDeclaredMethod("dummyMethod", String.class), 0);
        MethodArgumentNotValidException exception = new MethodArgumentNotValidException(parameter, bindingResult);

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handlingValidation(exception);

        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(ErrorCode.USERNAME_REQUIRED.getCode(), Objects.requireNonNull(response.getBody()).getCode());
        assertEquals(ErrorCode.USERNAME_REQUIRED.getMessage(), response.getBody().getMessage());
    }

    private void dummyMethod(String param) {}
}
