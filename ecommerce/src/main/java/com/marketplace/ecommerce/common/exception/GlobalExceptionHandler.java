package com.marketplace.ecommerce.common.exception;

import com.marketplace.ecommerce.common.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // =========================
    // 400 - Validation
    // =========================
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                message,
                request
        );
    }

    // =========================
    // 401 - Authentication
    // =========================
    @ExceptionHandler({
            InvalidCredentialsException.class,
            BadCredentialsException.class
    })
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            Exception ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.UNAUTHORIZED,
                "Email hoặc mật khẩu không đúng",
                request
        );
    }

    // =========================
    // 404 - Not found
    // =========================
    @ExceptionHandler({
            UserNotFoundException.class,
            UsernameNotFoundException.class
    })
    public ResponseEntity<ErrorResponse> handleUserNotFound(
            Exception ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                ex.getMessage(),
                request
        );
    }

    // =========================
    // 409 - Conflict
    // =========================
    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleEmailExists(
            EmailAlreadyExistsException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.CONFLICT,
                ex.getMessage(),
                request
        );
    }

    // =========================
    // 400 - Custom business exception
    // =========================
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorResponse> handleCustomException(
            CustomException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                ex.getMessage(),
                request
        );
    }

    // =========================
    // 500 - Fallback
    // =========================
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnhandledException(
            Exception ex,
            HttpServletRequest request
    ) {
        log.error("Unexpected error", ex);

        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.",
                request
        );
    }

    // =========================
    // Helper
    // =========================
    private ResponseEntity<ErrorResponse> buildResponse(
            HttpStatus status,
            String message,
            HttpServletRequest request
    ) {
        ErrorResponse response = new ErrorResponse(
                status.value(),
                status.getReasonPhrase(),
                sanitize(message),
                request.getRequestURI(),
                Instant.now()
        );
        return ResponseEntity.status(status).body(response);
    }

    private String sanitize(String message) {
        if (message == null) return "Unexpected error";
        return message.replaceAll("(?i)(select|insert|update|delete).*", "[SQL]");
    }
}
