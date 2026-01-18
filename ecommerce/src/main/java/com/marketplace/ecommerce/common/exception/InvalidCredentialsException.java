package com.marketplace.ecommerce.common.exception;

public class InvalidCredentialsException extends CustomException {
    public InvalidCredentialsException() {
        super("Email hoặc mật khẩu không đúng");
    }

    public InvalidCredentialsException(String message) {
        super(message);
    }
}
